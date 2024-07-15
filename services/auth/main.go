package main

import (
	"auth/routes"
	"auth/utils"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	db, err := utils.SetupDB()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	app := &utils.App{DB: db}

	r := gin.Default()

	routes.SetupRoutes(r, app)

	if err := r.Run(":8081"); err != nil {
		log.Fatal(err)
	}
}
