import React, {useState} from 'react';
import {Button, Form, Input, Modal, message} from "antd";
import {useApolloClient} from 'react-apollo';
import gql from "graphql-tag";

function _UsernameInputModal(
    {form: {getFieldDecorator, getFieldValue}, show, onNameOk}
) {
    const client = useApolloClient();
    const [validateError, setValidateError] = useState(null);

    const submit = (e) => {
        e.preventDefault();

        const username = getFieldValue('username').trim();
        if (username === '') {
            setValidateError('input username!');
            return
        } else {
            setValidateError(null);
        }

        client.query({
            query: gql`
                query($username: String!) {
                    checkUsername(username: $username)
                }
            `,
            variables: {username},
        }).then(({data}) => {
            if (data) {
                if (data.checkUsername) {
                    onNameOk(username)
                } else {
                    setValidateError('username has token')
                }
            }
        }).catch((errors) => {
            message.error("check username failed: " + errors)
        })
    };

    return <Modal title='input your username'
                  visible={show}
                  closable={false}
                  onOk={submit}
    >
        <Form>
            <Form.Item label='Username:' required validateStatus={validateError&&'error'} help={validateError}>
                {getFieldDecorator('username')(
                    <Input placeholder='username here'/>
                )}
            </Form.Item>
        </Form>
    </Modal>
}

const UsernameModal = Form.create({name: 'check-username'})(_UsernameInputModal);
export default UsernameModal;
