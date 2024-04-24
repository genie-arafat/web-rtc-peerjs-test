/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef, useState } from "react";
import socketIO from "socket.io-client";

const socket = socketIO.connect("localhost:4000");

export default function Home() {
  const peerInstanceRef = useRef(null);
  const [myPeerID, setMyPeerID] = useState(null);
  const [conn, setConn] = useState([]);
  const allPeers = new Set();

  const [peers, setPeers] = useState([]);

  const handleSendPeerJsID = (targetUserID) => {
    console.log("targetUserID", targetUserID);
    if (myPeerID) {
      socket.emit("peerRequest", {
        user_id: 1,
        peer_id: myPeerID,
        socketID: socket.id,
      });
    }
  };

  const connectToPeer = (peerId) => {
    if (peerInstanceRef?.current?.id === peerId) {
      console.log("Already connected to peer:", peerId);
      return;
    }

    if (peerInstanceRef?.current) {
      const connection = peerInstanceRef.current?.connect(peerId);
      console.log("conn", conn);
      setConn([...conn, { peer_id: peerId, con: connection }]); //r: save the connection we just set...

      connection.on("open", () => {
        console.log("Connected to peer", connection);
        // setIsConnectedToPeer(true);
      });

      connection.on("data", (data) => {
        console.log("RECEIVED MESSAGE DATA: ", data);
      });
    }
  };

  useEffect(() => {
    import("peerjs").then(({ default: Peer }) => {
      const peer = new Peer();

      peer.on("open", (id) => {
        console.log("My peer ID is: " + id);
        setMyPeerID(id);
      });

      peer.on("connection", (connection) => {
        // setConn([...conn, { peer_id: peer.id, con: connection }]);
        connection.on("data", (data) => {
          console.log("RECEIVED MESSAGE DATA: ", data);
        });
      });

      peerInstanceRef.current = peer;
      console.log("PEER INSTANCE SET TO: ", peer);

      return () => {
        peer.destroy();
      };
    });

    socket.on("peerRequest", (data) => {
      console.log("data", data);
      allPeers.add(data.peer_id);
      setPeers([...allPeers]);
      console.log("allPeers", allPeers);
    });

    return () => {
      socket.off("peerRequest");
      conn.forEach((c) => {
        c.con.close();
      });
    };
  }, []);

  return (
    <div>
      <div>My Peer Id: {myPeerID}</div>

      <div>
        All Peers
        {peers.map((peer) => (
          <div
            className="flex"
            key={peer}
          >
            <li
              className="text-sm cursor-pointer"
              onClick={() => connectToPeer(peer)}
            >
              {peer}
            </li>
            <button
              onClick={() => {
                let connection = conn.filter((c) => c.peer_id === peer);

                connection[0].con.send("my peer id: " + myPeerID);
                console.log("here", connection);
              }}
            >
              Send Message
            </button>
          </div>
        ))}
      </div>

      <br />
      <button onClick={() => handleSendPeerJsID("peer2")}>
        Set My Peer ID
      </button>
    </div>
  );
}
