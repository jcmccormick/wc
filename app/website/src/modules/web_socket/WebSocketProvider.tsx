import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useContexts, useUtil } from 'awayto/hooks';
import { SocketResponse, SocketResponseHandler } from 'awayto/core';

function WebSocketProvider({ children }: IProps): React.JSX.Element {

  const { setSnack } = useUtil();
  const { WebSocketContext, AuthContext } = useContexts();
  const { keycloak } = useContext(AuthContext) as AuthContextType;

  const [socket, setSocket] = useState<WebSocket | undefined>();
  const [connectionId, setConnectionId] = useState('');
  const reconnectSnackShown = useRef(false);
  const initialConnectionMade = useRef(false);

  const messageListeners = useRef(new Map<string, Set<SocketResponseHandler<unknown>>>());

  const connect = () => {

    fetch(`https://${location.hostname}/api/sock/ticket/`, {
      method: 'POST',
      headers: {
        Authorization: keycloak.token || ''
      }
    }).then(async res => {
      if (res.ok) {
        const [ticket, cid] = (await res.text()).split(':');

        const ws = new WebSocket(`wss://${location.hostname}/sock/${ticket}:${cid}`);

        ws.onopen = () => {
          console.log('socket open', cid);
          if (reconnectSnackShown.current) {
            setSnack({ snackOn: 'Reconnected!', snackType: 'success' });
            reconnectSnackShown.current = false;
          }
          setConnectionId(cid);
          setSocket(ws);
          initialConnectionMade.current = true;
        };

        ws.onclose = () => {
          console.log('socket closed. reconnecting...');
          if (!reconnectSnackShown.current) {
            setSnack({ snackOn: 'Connection lost, please wait...', snackType: 'warning' });
            reconnectSnackShown.current = true;
          }
          setTimeout(() => {
            connect();
          }, 5000);
        };

        ws.onerror = (error) => {
          console.error("socket error:", error);
          ws.close();
        };

        ws.onmessage = async (event: { data: Blob }) => {
          const { timestamp, sender, action, topic, payload } = JSON.parse(await event.data.text()) as SocketResponse<unknown>;
          const listeners = messageListeners.current.get(topic);

          if (listeners) {
            for (const listener of listeners) {
              await listener({ timestamp, sender, action, topic, payload: payload || {} });
            }
          }
        };
      } else {
        if (!reconnectSnackShown.current) {
          setSnack({ snackOn: 'Could not connect to socket, please wait...', snackType: 'warning' });
          reconnectSnackShown.current = true;
        }
        setTimeout(() => {
          connect();
        }, 5000);
      }
    }).catch(error => {
      const err = error as Error;
      setSnack({ snackOn: err.message, snackType: 'error' });
    });
  }

  useEffect(() => {
    connect();
  }, []);

  const webSocketContext = {
    connectionId,
    connected: socket?.readyState === WebSocket.OPEN,
    transmit(store, action, topic, payload) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ sender: connectionId, store, action, topic, payload }));
      }
    },
    subscribe(topic, callback) {
      const listeners = messageListeners.current.get(topic) || new Set();
      listeners.add(callback);
      messageListeners.current.set(topic, listeners);

      return () => {
        listeners.delete(callback);
        if (listeners.size === 0) {
          messageListeners.current.delete(topic);
        }
      };
    },
  } as WebSocketContextType;

  return useMemo(() => !initialConnectionMade.current || !WebSocketContext ? <></> :
    <WebSocketContext.Provider value={webSocketContext}>
      {children}
    </WebSocketContext.Provider>,
    [WebSocketContext, webSocketContext]
  );
}

export default WebSocketProvider;
