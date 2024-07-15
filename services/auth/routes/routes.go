package routes

import (
	"auth/controllers"
	"auth/utils"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, app *utils.App) {
	r.POST("/users", controllers.CreateNewUser(app))
	r.POST("/login", controllers.Login(app))
	r.GET("/users", utils.AuthMiddleware(), controllers.GetAllUsers(app))
	r.GET("/user", utils.AuthMiddleware(), controllers.GetUser(app))
}
