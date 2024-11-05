import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import ContentEditor from "../../components/ContentEditor";
import CodeEditor from "../../components/CodeEditor";
import "./styles/CollaborationPage.css";
import { collaborationSocket } from "../../config/socket";
import React, { useEffect } from 'react';

import NavBar from "../../components/NavBar";
import QuestionPanel from "../../components/QuestionPanel";

const CollaborationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const data = location.state.data;
  const { id, questionData } = data;
  const [activeTab, setActiveTab] = useState("code", "");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleSubmit = () => {
    collaborationSocket.emit("endSession");
  };

  collaborationSocket.on("sessionEnded", (socketId) => {
    window.location.href ='/';
  });

  // window.addEventListener("pagehide", (event) => {
  //   // Disconnect the socket
  //   collaborationSocket.disconnect();
  // });

  return (
    <div>
      <NavBar />
      <QuestionPanel questionData={questionData} />
      <div id="tabs">
        <button onClick={() => handleTabChange("code")} autoFocus>
          Code
        </button>
        <button onClick={() => handleTabChange("content")}>Text</button>
        <button id="submitButton" onClick={handleSubmit}>
          Submit
        </button>
      </div>
      <div id="tab-content">
        {/* Render both components with inline styles for visibility control */}
        <div style={{ display: activeTab === "code" ? "block" : "none" }}>
          <CodeEditor id={id} />
        </div>
        <div style={{ display: activeTab === "content" ? "block" : "none" }}>
          <ContentEditor id={id} />
        </div>
      </div>
    </div>
  );
};

export default CollaborationPage;
