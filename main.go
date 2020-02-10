package main

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gqlengine/gqlengine"
	"github.com/gqlengine/playground"
)

func main() {
	engine := gqlengine.NewEngine(gqlengine.Options{
		Tracing:                    true,
		MultipartParsingBufferSize: 1024 * 1024 * 10,
	})

	if err := engine.PreRegisterInterface((*Message)(nil), MessageBase{}); err != nil {
		panic(err)
	}
	if _, err := engine.RegisterObject(TextMessage{}); err != nil {
		panic(err)
	}
	if _, err := engine.RegisterObject(ImageMessage{}); err != nil {
		panic(err)
	}
	if _, err := engine.RegisterObject(Notification{}); err != nil {
		panic(err)
	}

	engine.NewQuery(GetMessageHistory).
		Name("chatHistory")

	engine.NewSubscription(StartMessaging).
		OnUnsubscribed(StopMessaging).
		Name("chatMessage")

	engine.NewMutation(SendTextMessage)
	engine.NewMutation(SendImageMessage)

	engine.NewQuery(CheckUsername)

	go messageLoop()

	if err := engine.Init(); err != nil {
		panic(err)
	}

	playground.SetEndpoints("/api/graphql", "/api/graphql/subscriptions")

	r := mux.NewRouter()
	r.HandleFunc("/api/graphql", engine.ServeHTTP)
	r.HandleFunc("/api/graphql/subscriptions", engine.ServeWebsocket)
	r.PathPrefix("/api/graphql/playground").Handler(playground.GetHandle("/api/graphql/playground"))

	r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(AssetFile())))

	println("open demo page at: http://localhost:9996/")
	println("open playground http://localhost:9996/api/graphql/playground/")
	if err := http.ListenAndServe(":9996", r); err != nil {
		panic(err)
	}
}
