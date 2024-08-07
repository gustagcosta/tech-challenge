package controllers

import (
	"auth/models"
	"auth/utils"
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func GetAllUsers(app *utils.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		isAdmin := c.MustGet("isAdmin").(bool)

		if !isAdmin {
			c.Status(http.StatusUnauthorized)
			c.Abort()
			return
		}

		rows, err := app.DB.Query("SELECT id, name, cpf, email, phone, address, is_admin FROM users")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var users []models.User
		for rows.Next() {
			var user models.User
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
}

func RequestExcludeData(app *utils.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.MustGet("userId").(string)

		newID, err := uuid.NewRandom()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		_, err = app.DB.Exec("INSERT INTO delete_data_request (id, user_id, approved, message) VALUES (?, ?, false, '')", newID, userId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Delete data request created"})
	}
}

func ApproveExcludeData(app *utils.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !c.MustGet("isAdmin").(bool) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			return
		}

		var request struct {
			RequestID string `json:"request_id" binding:"required"`
			Approved  bool   `json:"approved" binding:"required"`
			Message   string `json:"message"`
		}

		if err := c.BindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var deleteRequest struct {
			UserID string `db:"user_id"`
		}

		err := app.DB.QueryRow("SELECT user_id FROM delete_data_request WHERE id = ?", request.RequestID).Scan(&deleteRequest.UserID)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
			return
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if deleteRequest.UserID == c.MustGet("userId").(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You cannot approve your own request"})
			return
		}

		_, err = app.DB.Exec("UPDATE delete_data_request SET approved = ?, message = ? WHERE id = ?", request.Approved, request.Message, request.RequestID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if request.Approved {
			_, err = app.DB.Exec("DELETE FROM users WHERE id = ?", deleteRequest.UserID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{"message": "Request updated and user deleted successfully"})
	}
}

func Login(app *utils.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var credentials struct {
			Cpf      string `json:"cpf" binding:"required"`
			Password string `json:"password" binding:"required"`
		}

		if err := c.BindJSON(&credentials); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var user models.User
		err := app.DB.QueryRow("SELECT id, name, cpf, email, password, phone, address, is_admin FROM users WHERE cpf = ?", credentials.Cpf).Scan(&user.ID, &user.Name, &user.Cpf, &user.Email, &user.Password, &user.Phone, &user.Address, &user.IsAdmin)
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

		token, err := utils.GenerateToken(user.ID, user.IsAdmin)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar token JWT"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"token": token, "expire_in": 24 * 3600})
	}
}

func ExcludeDataRequest(app *utils.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		isAdmin := c.MustGet("isAdmin").(bool)

		if !isAdmin {
			c.Status(http.StatusUnauthorized)
			c.Abort()
			return
		}

		rows, err := app.DB.Query("SELECT id, user_id, approved, message, created_at FROM delete_data_request")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var results []map[string]interface{}

		for rows.Next() {
			var id, userId, message, createdAt string
			var approved bool

			err := rows.Scan(&id, &userId, &approved, &message, &createdAt)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			result := map[string]interface{}{
				"id":         id,
				"user_id":    userId,
				"approved":   approved,
				"message":    message,
				"created_at": createdAt,
			}

			results = append(results, result)
		}

		if err = rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, results)
	}
}

func GetUser(app *utils.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.MustGet("userId").(string)

		var user models.User
		err := app.DB.QueryRow("SELECT id, name, cpf, email, password, phone, address, is_admin FROM users WHERE id = ?", userId).Scan(&user.ID, &user.Name, &user.Cpf, &user.Email, &user.Password, &user.Phone, &user.Address, &user.IsAdmin)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, user)
	}
}

func CreateNewUser(app *utils.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		var user models.User
		if err := c.BindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		tx, err := app.DB.Begin()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var existingUser models.User
		err = tx.QueryRow("SELECT id, name, cpf, email, password, phone, address, is_admin FROM users WHERE cpf = ?", user.Cpf).Scan(&existingUser.ID, &existingUser.Name, &existingUser.Cpf, &existingUser.Email, &existingUser.Password, &existingUser.Phone, &existingUser.Address, &existingUser.IsAdmin)
		if err != nil && err != sql.ErrNoRows {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if existingUser.ID != "" {
			tx.Rollback()
			c.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
			return
		}

		newUser, err := models.NewUser(user.Name, user.Cpf, user.Email, user.Password, user.Phone, user.Address, user.IsAdmin)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		_, err = tx.Exec("INSERT INTO users (id, name, cpf, email, password, phone, address, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", newUser.ID, newUser.Name, newUser.Cpf, newUser.Email, newUser.Password, newUser.Phone, newUser.Address, newUser.IsAdmin)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if err := tx.Commit(); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message": "User created", "userID": newUser.ID})
	}
}
