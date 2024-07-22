package main

import (
	"auth/controllers"
	"auth/utils"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupRouter(db *sql.DB) *gin.Engine {
	r := gin.Default()
	app := &utils.App{DB: db} // Ajuste conforme sua estrutura de aplicação

	// Middleware para definir isAdmin
	r.Use(func(c *gin.Context) {
		c.Set("isAdmin", true) // Defina true ou false conforme necessário
		c.Next()
	})

	r.GET("/exclude-data", controllers.ExcludeDataRequest(app))
	return r
}

func TestExcludeDataRequest(t *testing.T) {
	// Configura o banco de dados simulado
	db, mock, _ := sqlmock.New()
	defer db.Close()

	// Defina a consulta SQL e os resultados simulados
	rows := sqlmock.NewRows([]string{"id", "user_id", "approved", "message", "created_at"}).
		AddRow(1, 101, true, "Message 1", "2024-07-22T00:00:00Z").
		AddRow(2, 102, false, "Message 2", "2024-07-22T01:00:00Z")

	mock.ExpectQuery("SELECT id, user_id, approved, message, created_at FROM delete_data_request").
		WillReturnRows(rows)

	// Configura o roteador com o DB mockado
	router := setupRouter(db)

	// Cria uma solicitação HTTP simulada
	req, _ := http.NewRequest("GET", "/exclude-data", nil)
	w := httptest.NewRecorder()

	// Executa a solicitação
	router.ServeHTTP(w, req)

	// Verifique os resultados
	assert.Equal(t, http.StatusOK, w.Code)

	var response []map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	expected := []map[string]interface{}{
		{"id": float64(1), "user_id": float64(101), "approved": true, "message": "Message 1", "created_at": "2024-07-22T00:00:00Z"},
		{"id": float64(2), "user_id": float64(102), "approved": false, "message": "Message 2", "created_at": "2024-07-22T01:00:00Z"},
	}

	assert.Equal(t, expected, response)
}
