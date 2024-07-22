package routes

import (
	"auth/controllers"
	"auth/utils"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, app *utils.App) {
	apiGroup := r.Group("/api")

	apiGroup.POST("/users", controllers.CreateNewUser(app))
	apiGroup.POST("/login", controllers.Login(app))

	authGroup := apiGroup.Group("")
	authGroup.Use(utils.AuthMiddleware())

	authGroup.POST("/exclude-data", controllers.RequestExcludeData(app))
	authGroup.GET("/users", controllers.GetAllUsers(app))
	authGroup.GET("/user", controllers.GetUser(app))
	authGroup.POST("/approve-exclude-data", controllers.ApproveExcludeData(app))
}
