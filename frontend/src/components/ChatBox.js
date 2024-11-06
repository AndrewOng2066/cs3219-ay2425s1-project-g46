import React, { useState, useEffect } from "react";
import { collaborationSocket } from "../config/socket";
import "./styles/ChatBox.css";
import useSessionStorage from "../hook/useSessionStorage";

const ChatBox = ({ id }) => {
  const [isOpen, setIsOpen] = useState(false);
//   const [message, setMessage] = useSessionStorage("", "message");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [email,] = useSessionStorage("", "email");


  const openForm = () => {
    setIsOpen(true);
  };

  const closeForm = () => {
    setIsOpen(false);
    setMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Message sent:", message);
    
    const formattedMessage = `${email}: ${message}`;
    collaborationSocket.emit("sendMessage", { id, message: formattedMessage });
    setMessages((prevMessages) => [...prevMessages, `${email}: ${message}`]);
    setMessage(""); 

    const messagesBox = document.getElementById('messagesbox');
    messagesBox.scrollTop = messagesBox.scrollHeight;
    // closeForm();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { // Allow Shift + Enter for new line
        e.preventDefault();
        handleSubmit(e);
    }
  };
  

  useEffect(() => {
    // console.log(id);
    console.log("recieved msg");
    const receiveMessageHandler = ({ message }) => {
        // console.log("Received message:", message);
        setMessages((prevMessages) => [...prevMessages, message]); 
        
        };
    

    
    collaborationSocket.on("receiveMessage", receiveMessageHandler);
    return () => {
        collaborationSocket.off("receiveMessage", receiveMessageHandler);
        };
    }, [id]);


  return (
    <div id="chatbox">
      <button className="open-button" onClick={openForm}>
        Chat
      </button>
      

      {isOpen && (
        <div className="chat-popup" id="myForm">
          <form action="/action_page.php" className="form-container" onSubmit={handleSubmit}>
            <h1>Chat</h1>
            <div id = "messagesbox" className="messages">
                {/* Display all messages */}
                {messages.map((msg, index) => (
                <div key={index} className="message">{msg}</div>
                ))}
            </div>
            {/* <label htmlFor="msg"><b>Message</b></label> */}
            <textarea
              placeholder="Type message.."
              name="msg"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            ></textarea>
            <button type="submit" className="btn">Send</button>
            <button type="button" className="btn cancel" onClick={closeForm}>
              Close
            </button>
          </form>
          
        </div>
      )}
    </div>
  );
};

export default ChatBox;
