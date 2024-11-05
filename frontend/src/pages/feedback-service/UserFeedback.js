// Author(s): Andrew
import React, { useState } from "react";
import {useLocation } from "react-router-dom";
import axios from "axios";
import "./styles/UserFeedback.css";
import NavBar from "../../components/NavBar";
import RatingReview from "../../components/RatingReview";

function Signup() {

  const location = useLocation();
  const { otherUserEmail, roomId } = location.state || {};

  const [values, setValues] = useState({
    email: otherUserEmail,
    rating: 0,
    comment: '',
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const [errorMessage, setErrorMessage] = useState(''); // State for error message

  const handleInput = (event) => {
    setValues(prev => ({ ...prev, [event.target.name]: event.target.value }));

  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    // Reset previous errors
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');

    // Simple validation: check if fields are empty
    let newErrors = {};
    if (!values.email) newErrors.email = "Email is required.";
    if (!values.rating) newErrors.rating = "Rating is required.";
    if (!values.comment) newErrors.comment = "Comment is required.";

    // Set errors if any
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const requestedData = {
      email: values.email,
      newReview: {
        by: sessionStorage.getItem("email"),
        comment: values.comment,
        rating: values.rating
      }
    };

    // If all fields are filled, proceed with submission
    axios.post("http://localhost:5004/feedback/adduserreview", requestedData)
      .then(res => {
        setValues({
          email: '',
          rating: 0,
          comment: ''
        });
        setSuccessMessage("Feedback submitted successfully!");
      })
      .catch(err => {
        if (err.response && err.response.data.message) {
          setErrors(prevErrors => ({ ...prevErrors, email: err.response.data.message }));
        } else {
          console.log(err);
        }
        setErrorMessage("An error occurred. Please try again.");
      });
  };


  return (
    <div >
      <NavBar />
      <div id="feedbackFormContainer">
        <h1>Feedback Form</h1>
        <form action='' onSubmit={handleSubmit}>
          <div className="messageContainer">
            {successMessage && <p className="successLabel">{successMessage}</p>}
            {errorMessage && <p className="errorLabel">{errorMessage}</p>}
            </div>
          <div className='formGroup'>
            <label htmlFor='email' className='inputLabel'><strong>Collaborator's Email</strong></label>
            <input type='email' placeholder='Email' name='email' value={values.email} onChange={handleInput} className='inputBox' readOnly/>
            {errors.email && <span className='error-Label'> {errors.email}</span>}
          </div>
          
          <div className='formGroup'>
            <label htmlFor='rating' className='inputLabel'><strong>Rating</strong></label>
            <RatingReview rating={values.rating} setValues={setValues} />
            {errors.rating && <span className='error-Label'> {errors.rating}</span>}
          </div>
          <div className='formGroup'>
            <label htmlFor='comment' className='inputLabel'><strong>Comment</strong></label>
            <textarea
              placeholder='Enter your comment here'
              name='comment'
              value={values.comment}
              onChange={handleInput}
              className='inputBox'
              rows="4" 
            />
            {errors.comment && <span className='error-Label'> {errors.comment}</span>}
          </div>
          <div className="submitButton">
            <button className="register-button">Submit</button>
          </div>

        </form>
      </div>

    </div>
  )
}

export default Signup