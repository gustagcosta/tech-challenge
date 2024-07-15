package models

import (
	"fmt"
	"regexp"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID       string `bson:"id" json:"id"`
	Name     string `bson:"name" json:"name"`
	Cpf      string `bson:"cpf" json:"cpf"`
	Email    string `bson:"email" json:"email"`
	Password string `bson:"password" json:"password"`
	IsAdmin  bool   `bson:"isAdmin" json:"isAdmin"`
}

func NewUser(name, cpf, email, password string, isAdmin bool) (*User, error) {
	user := &User{
		Name:     name,
		Cpf:      cpf,
		Email:    email,
		Password: password,
		IsAdmin:  isAdmin,
	}

	if err := user.validate(); err != nil {
		return nil, err
	}

	newID, err := uuid.NewRandom()
	if err != nil {
		return nil, fmt.Errorf("failed while creating user identity")
	}
	user.ID = newID.String()

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
	cpfRegex := `^\d{11}$`
	return regexp.MustCompile(cpfRegex).MatchString(cpf)
}

func hashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}
