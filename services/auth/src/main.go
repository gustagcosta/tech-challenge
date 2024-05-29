package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func setupDB() (*sql.DB, error) {
	db, err := sql.Open("mysql", "docker:docker@tcp(mysql:3306)/database")
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	return db, nil
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "token not found"})
			c.Abort()
			return
		}

		tokenString := authHeader[len("Bearer "):]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return secretKey, nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "error while get user info"})
			c.Abort()
			return
		}

		c.Set("userId", claims["userId"])
		c.Set("isAdmin", claims["isAdmin"])

		c.Next()
	}
}

type User struct {
	ID       string `bson:"id" json:"id"`
	Name     string `bson:"name" json:"name"`
	Cpf      string `bson:"cpf" json:"cpf"`
	Email    string `bson:"email" json:"email"`
	Password string `bson:"password" json:"password"`
	IsAdmin  bool   `bson:"isAdmin" json:"isAdmin"`
}

func NewUser(name, cpf, email, password string, isAdmin bool) (*User, error) {
	// cria objeto base
	user := &User{
		Name:     name,
		Cpf:      cpf,
		Email:    email,
		Password: password,
		IsAdmin:  isAdmin,
	}

	// validações
	if err := user.validate(); err != nil {
		return nil, err
	}

	// gera uuid
	newID, err := uuid.NewRandom()
	if err != nil {
		return nil, fmt.Errorf("failed while creating user identity")
	}
	user.ID = newID.String()

	// encripta password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("failed while creating user")
	}
	user.Password = hashedPassword

	return user, nil
}

func (u *User) validate() error {
	if u.Name == "" || len(u.Name) < 3 {
		return fmt.Errorf("name must not be empty or have less than 3 characters")
	}

	if u.Email == "" || !isValidEmail(u.Email) {
		return fmt.Errorf("email is not valid")
	}

	if u.Cpf == "" || !isValidCPF(u.Cpf) {
		return fmt.Errorf("cpf is not valid")
	}

	if u.Password == "" || len(u.Password) < 6 {
		return fmt.Errorf("password must not be empty or have less than 6 characters")
	}

	return nil
}

func isValidEmail(email string) bool {
	emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	return regexp.MustCompile(emailRegex).MatchString(email)
}

func isValidCPF(cpf string) bool {
	cpfRegex := `^\d{3}\.\d{3}\.\d{3}-\d{2}$`
	return regexp.MustCompile(cpfRegex).MatchString(cpf)
}

func hashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

var secretKey = []byte("777")

type App struct {
	DB *sql.DB
}

func (app *App) GetAllUsers(c *gin.Context) {
	isAdmin := c.MustGet("isAdmin").(bool)

	if !isAdmin {
		c.Status(http.StatusUnauthorized)
		c.Abort()
		return
	}

	rows, err := app.DB.Query("SELECT id, name, cpf, email, isAdmin FROM users")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.Name, &user.Cpf, &user.Email, &user.IsAdmin); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

func (app *App) Login(c *gin.Context) {
	var credentials struct {
		Cpf      string `json:"cpf" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.BindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user User
	err := app.DB.QueryRow("SELECT id, name, cpf, email, password, isAdmin FROM users WHERE cpf = ?", credentials.Cpf).Scan(&user.ID, &user.Name, &user.Cpf, &user.Email, &user.Password, &user.IsAdmin)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(credentials.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid password"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId":  user.ID,
		"isAdmin": user.IsAdmin,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	signedToken, err := token.SignedString(secretKey)
	if err != nil {
		fmt.Println(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar token JWT"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": signedToken, "expire_in": 24 * 3600})
}

func (app *App) GetUser(c *gin.Context) {
	userId := c.MustGet("userId").(string)

	var user User
	err := app.DB.QueryRow("SELECT id, name, cpf, email, password, isAdmin FROM users WHERE id = ?", userId).Scan(&user.ID, &user.Name, &user.Cpf, &user.Email, &user.Password, &user.IsAdmin)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (app *App) CreateNewUserfunc(c *gin.Context) {
	var user User
	if err := c.BindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingUser User
	err := app.DB.QueryRow("SELECT id, name, cpf, email, password, isAdmin FROM users WHERE cpf = ?", user.Cpf).Scan(&existingUser.ID, &existingUser.Name, &existingUser.Cpf, &existingUser.Email, &existingUser.Password, &existingUser.IsAdmin)
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if existingUser.ID != "" {
		c.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
		return
	}

	newUser, err := NewUser(user.Name, user.Cpf, user.Email, user.Password, user.IsAdmin)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = app.DB.Exec("INSERT INTO users (id, name, cpf, email, password, isAdmin) VALUES (?, ?, ?, ?, ?, ?)", newUser.ID, newUser.Name, newUser.Cpf, newUser.Email, newUser.Password, newUser.IsAdmin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created", "userID": newUser.ID})
}

func main() {
	db, err := setupDB()
	if err != nil {
		log.Fatal(err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	app := &App{DB: db}

	r := gin.Default()

	r.POST("/users", app.CreateNewUserfunc)
	r.POST("/login", app.Login)
	r.GET("/users", authMiddleware(), app.GetAllUsers)
	r.GET("/user", authMiddleware(), app.GetUser)

	if err := r.Run(":7070"); err != nil {
		log.Fatal(err)
	}
}
