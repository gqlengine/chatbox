import React, {useState} from 'react';
import {useMutation} from 'react-apollo';
import gql from "graphql-tag";
import {Button, Col, Input, message, Row} from "antd";

export default function MessageInput({sender, setSender}) {
    const [text, setText] = useState('');
    const [sendTextMessage, {loading: sendingTextMessage}] = useMutation(gql`
        mutation($text: String!) {
            sendTextMessage(
                sender: "${sender}",
                text: $text,
            )
        }
    `);

    const typeMessage = (e) => {
        e.preventDefault();
        setText(e.target.value);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        sendTextMessage({
            variables: {
                text,
            }
        }).catch((err) => {
            message.error('sent failure: ', err)
        }).then(() => {
            setText('')
        })
    };

    return <div>
        <Row>
        <Input.TextArea placeholder='input your message here!'
                        rows={5}
                        value={text}
                        onChange={typeMessage}/>
        </Row>
        <Row style={{marginTop: 10}} type='flex' justify='space-between'>
            <span>
            Username:
            <Input style={{width: 'auto', marginLeft: 5}} value={sender} onChange={(e) => {
                e.preventDefault();
                setSender(e.target.value);
            }}/>
            </span>
            <Button onClick={sendMessage}
                    type='primary'
                    loading={sendingTextMessage}>Send</Button>
        </Row>
    </div>
}
