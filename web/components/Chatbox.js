import React, {useEffect, useState} from 'react';
import styles from './chat.less';
import {Col, Divider, message, Row} from "antd";
import MessageInput from "./MessageInput";
import {useQuery, useSubscription} from 'react-apollo';
import gql from "graphql-tag";
import UsernameModal from "./UsernameModal";

const messageParts = `
    __typename
    sentTime
    sender
    ... on TextMessage {
        text
    }
    ... on ImageMessage {
        mimeType
        image
    }
`;

export default function Chatbox() {
    const [username, setUsername] = useState('');

    const {loading, error, data, subscribeToMore} = useQuery(gql`
    query {
        chatHistory {
            ${messageParts}
        }
    }`);

    if (error) {
        message.error("load chat history error: " + error)
    }

    useEffect(() => {
        if (username === '') {
            return;
        }
        subscribeToMore({
            document: gql`
                subscription($sender: String!) {
                    chatMessage(sender: $sender) {
                        ${messageParts}
                    }
                }`,
            variables: {
                sender: username,
            },
            updateQuery: ({chatHistory}, {subscriptionData}) => {
                if (!subscriptionData.data)
                    return {chatHistory};
                const {chatMessage} = subscriptionData.data;
                return {chatHistory: chatHistory.concat(chatMessage)};
            },
            onError: (err) => {
                message.error("subscription error: " + err);
            }
        });
    }, [username]);

    let {chatHistory = []} = data || {};

    const renderMessage = (msg) => {
        const onLeft = msg.sender !== username;
        let content = null;
        switch (msg.__typename) {
            case 'TextMessage':
                content = <span>{msg.text}</span>;
                break;
            case 'ImageMessage':
                const bg = `url(data:${msg.mimeType};base64,${msg.image})`;
                content = <span className={styles.image} style={{backgroundImage: bg}} />
                break;
        }
        const key = `${msg.sender} - ${msg.sentTime}`;
        if (onLeft) {
            return <Row key={key} type='flex' justify='start' align='middle'>
                <Divider><span className={styles.divider}>{msg.sentTime}</span></Divider>
                <b style={{marginRight: 10}}>{msg.sender}</b> {content}
            </Row>
        } else {
            return <Row key={key} type='flex' justify='end' align='middle'>
                <Divider><span className={styles.divider}>{msg.sentTime}</span></Divider>
                {content} <b style={{marginLeft: 10}}>{msg.sender}</b>
            </Row>
        }
    };

    return (
        <Col className={styles.box}>
            <Row>
                <Col className={styles.messages}>
                    {chatHistory.map(renderMessage)}
                </Col>
            </Row>
            <Row>
                <MessageInput sender={username} setSender={setUsername}/>
            </Row>
            <UsernameModal show={username === ''} onNameOk={setUsername}/>
        </Col>
    )
}
