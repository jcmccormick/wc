import React, { useEffect, useMemo, useRef } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { SocketMessage, plural } from 'awayto/core';
import { useComponents, useContexts, useWebSocketSubscribe } from 'awayto/hooks';

declare global {
  interface IProps {
    topicId?: string;
    topicMessages?: SocketMessage[];
    setTopicMessages?(selector: (prop: SocketMessage[]) => SocketMessage[]): SocketMessage[];
  }
}

export function WSTextProvider({ children, topicId, topicMessages, setTopicMessages }: IProps): React.JSX.Element {
  if (!topicId) return <></>;

  const { WSTextContext } = useContexts();

  const { GroupedMessages, SubmitMessageForm } = useComponents();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    userList,
    connectionId,
    connected,
    subscriber,
    unsubscriber,
    sendMessage: sendTextMessage
  } = useWebSocketSubscribe<{ message: string, style: SocketMessage['style'] }>(topicId, ({ sender, topic, type, payload }) => {
    console.log('RECEIVED A NEW SOCKET TEXT', { userList, connectionId, sender, topic, type }, JSON.stringify(payload));

    const { message, style } = payload;

    const user = Object.values(userList).find(p => p.cids.includes(sender));
    
    if (message && style && user && setTopicMessages) {
      setTopicMessages(m => [...m, {
        ...user,
        sender,
        style,
        message,
        timestamp: (new Date()).toString()
      }]);
    }
  });

  const userListValues = useMemo(() => Object.values(userList || {}), [userList]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' })
  }, [messagesEndRef.current, topicMessages]);

  useEffect(() => {
    if (setTopicMessages && subscriber) {
      setTopicMessages(m => [...m, {
        ...subscriber,
        sender: subscriber.cids[subscriber.cids.length - 1],
        style: 'written',
        message: `${subscriber.name} entered chat.`,
        timestamp: (new Date()).toString()
      }]);
    }
  }, [subscriber, setTopicMessages]);

  useEffect(() => {
    if (setTopicMessages && unsubscriber) {
      setTopicMessages(m => [...m, {
        ...unsubscriber,
        sender: unsubscriber.cids[unsubscriber.cids.length - 1],
        style: 'written',
        message: `${unsubscriber.name} left chat.`,
        timestamp: (new Date()).toString()
      }]);
    }
  }, [unsubscriber, setTopicMessages]);

  const wsTextContext = {
    wsTextConnectionId: connectionId,
    wsTextConnected: connected,
    messagesEnd: useMemo(() => <Box ref={messagesEndRef} />, []),
    chatLog: useMemo(() => <GroupedMessages topicMessages={topicMessages} />, [topicMessages]),
    submitMessageForm: <>
      <SubmitMessageForm
        sendTextMessage={(message: string) => {
          sendTextMessage('text', { style: 'written', message });
        }}
      />
      <Typography variant="caption">
        {!!userListValues.length && `${plural(userListValues.length, 'participant', 'participants')}: ${userListValues.map(p => p.name).join(', ')}`}
      </Typography>
    </>
  } as WSTextContextType | null;

  return useMemo(() => !WSTextContext ? <></> :
    <WSTextContext.Provider value={wsTextContext}>
      {children}
    </WSTextContext.Provider>,
    [WSTextContext, wsTextContext]
  );
}

export default WSTextProvider;