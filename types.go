package main

import (
	"time"

	"github.com/gqlengine/gqlengine"
)

type (
	IsObject    = gqlengine.IsGraphQLObject
	IsInput     = gqlengine.IsGraphQLInput
	IsInterface = gqlengine.IsGraphQLInterface
	IsArguments = gqlengine.IsGraphQLArguments
)

type UserInfo struct {
	IsObject `gqlDesc:"user information"`

	Username string `json:"username"`
	Avatar   string `json:"avatar"`
}

type Message interface {
	IsMessage()
}

type MessageBase struct {
	IsInterface

	SentTime time.Time `json:"sentTime" gqlRequired:"true"`
	Sender   string    `json:"sender" gqlRequired:"true"`
}

type TextMessage struct {
	IsObject
	MessageBase

	Text string `json:"text"`
}

type ImageMessage struct {
	IsObject
	MessageBase

	Image string `json:"image"`
}

type Notification struct {
	IsObject
	MessageBase

	JoinedTime  time.Time `json:"joinedTime"`
	Participant string    `json:"participant"`
}

func (m *TextMessage) IsMessage()  {}
func (m *ImageMessage) IsMessage() {}
func (m *Notification) IsMessage() {}
