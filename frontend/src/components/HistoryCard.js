import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/HistoryCard.css";

export const HistoryCard = ({historyData}) => {
  const navigate = useNavigate();
  
  const formatDate = (timestamp) => {
    const date = new Date(Date.parse(timestamp)); // Parse without timezone conversion
  
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const passingData = () => {
    navigate('/feedback/userfeedback', {
      state: {
        otherUserEmail: historyData.otherUserEmail, // Pass email
        roomId: historyData.roomId, // Pass roomId
      },
    });
  };
  

  return (
    <div className='historyCard'>
      <p><strong>With : </strong> {historyData.otherUserEmail}</p>
      <p><strong>Title: </strong> {historyData.title}</p>
      <p><strong>Category, Difficulty: </strong>{historyData.category}, {historyData.complexity}</p>
      <p><strong>Question: </strong> {historyData.description}</p>
      <p className='fromText'> {formatDate(historyData.timestamp)}</p>

      {historyData.reviewGiven ? 
        null 
        : 
        <button className="review-button" onClick={passingData} >Give Review</button>
      }
    </div>
  );
};
