package main

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"sync"
	"time"

	"github.com/gqlengine/gqlengine"
)

var (
	messageLock sync.Mutex
	messages    []Message

	clients = map[string]gqlengine.Subscription{}
	subChan = make(chan Message)
)

func messageLoop() {
	for {
		select {
		case msg := <-subChan:
			messageLock.Lock()
			for username, subscription := range clients {
				err := subscription.SendData(msg)
				if err != nil {
					fmt.Printf("send to %s error %s", username, err.Error())
				}
			}
			messageLock.Unlock()
		}
	}
}

func GetMessageHistory() []Message {
	messageLock.Lock()
	defer messageLock.Unlock()
	return messages
}

func saveAndResendMessage(msg Message) {
	switch msg := msg.(type) {
	case *TextMessage:
		fmt.Printf("recv from %s: \"%s\" (%s)\n", msg.Sender, msg.Text, msg.SentTime)
	case *ImageMessage:
		fmt.Printf("recv from %s: [image] (%s)\n", msg.Sender, msg.SentTime)
	}

	messageLock.Lock()
	messages = append(messages, msg)
	messageLock.Unlock()

	select {
	case subChan <- msg:
	}
}

func SendTextMessage(params *struct {
	IsArguments

	Sender string `json:"sender" gqlDesc:"username of the sender"`
	Text   string `json:"text" gqlDesc:"text of the message" gqlRequired:"true"`
}) {
	saveAndResendMessage(&TextMessage{
		MessageBase: MessageBase{
			Sender:   params.Sender,
			SentTime: time.Now(),
		},
		Text: params.Text,
	})
}

func SendImageMessage(params *struct {
	IsArguments

	Sender string           `json:"sender" gqlDesc:"username of the sender"`
	Image  gqlengine.Upload `json:"image" gqlDesc:"image file of the message"`
}) error {
	image, err := params.Image.Open()
	if err != nil {
		return err
	}
	content, err := ioutil.ReadAll(image)
	if err != nil {
		return err
	}

	b64Content := base64.StdEncoding.EncodeToString(content)
	saveAndResendMessage(&ImageMessage{
		MessageBase: MessageBase{
			Sender:   params.Sender,
			SentTime: time.Now(),
		},
		MimeType: params.Image.Header.Get("Content-Type"),
		Image:    b64Content,
	})
	return nil
}

type ChatSession struct {
	username string
}

func (s *ChatSession) GraphQLSubscriptionSession() {}

func StartMessaging(subscription gqlengine.Subscription, params *struct {
	IsArguments
	Sender string `json:"sender" gqlRequired:"true"`
}) (Message, *ChatSession, error) {
	messageLock.Lock()
	defer messageLock.Unlock()
	println("new connection:", params.Sender)
	clients[params.Sender] = subscription
	return nil, &ChatSession{username: params.Sender}, nil
}

func StopMessaging(session *ChatSession) {
	println("lost one connection:", session.username)
	messageLock.Lock()
	delete(clients, session.username)
	messageLock.Unlock()
}

func CheckUsername(params *struct {
	IsArguments
	Username string `json:"username" gqlRequired:"true"`
}) bool {
	_, ok := clients[params.Username]
	return !ok
}
