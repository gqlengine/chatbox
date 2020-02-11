import React, {useState} from 'react';
import {useMutation} from 'react-apollo';
import gql from "graphql-tag";
import {Button, Col, Icon, Input, message, Row, Upload} from "antd";

export default function MessageInput({sender}) {
    const [text, setText] = useState('');
    const [sendTextMessage, {loading: sendingTextMessage}] = useMutation(gql`
        mutation($text: String!) {
            sendTextMessage(
                sender: "${sender}",
                text: $text,
            )
        }
    `);
    const [sendImageMessage, {loading: sendingImageMessage}] = useMutation(gql`
        mutation($image: Upload!) {
            sendImageMessage(
                sender: "${sender}",
                image: $image,
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

    const upload = ({file, onProgress, onError, onSuccess}) => {
        sendImageMessage({
            variables: {
                image: file,
            }
        }).then(() => {
            onSuccess()
        }).catch((err) => {
            onError(err)
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
            <Upload
                accept='.jpg,.jpeg,.png'
                customRequest={upload}
                showUploadList={false}
            >
                <Button loading={sendingImageMessage}>
                    <Icon type='upload'/>
                    Send image
                </Button>
            </Upload>
            <Button onClick={sendMessage}
                    type='primary'
                    loading={sendingTextMessage}>
                <Icon type='thunderbolt'/>
                Send
            </Button>
        </Row>
    </div>
}
