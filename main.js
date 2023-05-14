/* eslint-disable no-unused-expressions */
/* eslint-disable semi */

// main variables
let filledState = true;
const apiUrl = 'https://api.noquestionyet.com/api:84zPS-li';
const paidPlanId = 'prc_deploy-plan-n4ae053s';
let userStatus = false;

// checking the subscription status in the db
function getMemberStatus (currentUserId) {
  let activeStatus = true;
  const currentMember = fetch(`${apiUrl}/member/${currentUserId}`);
  currentMember.then(response => {
    if (response.ok) {
      return response.json();
    } else {
      return response.json().then((text) => {
        throw new Error(text);
      })
    }
  }).then(data => {
    // check if subscription is not expired
    const expirationDate = data.memberstack_expiration_date;
    const currentDate = Math.floor(Date.now() / 1000);
    const currentUserPriceId = data.price_id;
    console.log(currentUserPriceId)
    if (currentUserPriceId === paidPlanId) {
      console.log(expirationDate)
      expirationDate && currentDate > expirationDate ? activeStatus = false : activeStatus = true;
    } else {
      activeStatus = false;
    }
    activateScript(activeStatus);
  }).catch(error => {
    showError(error.message);
  })
}

// checking the status of the subscription and setting the main variables based on that
function activateScript (activeStatus) {
  const currentURL = window.location.hostname;
  currentURL.includes('webflow.io') ? userStatus = true : userStatus = activeStatus;
  setFormShowers();
}

// hiding quiz name and point number, leaderboard
const quizName = document.querySelector('[nqy-quiz="quiz-name"]');
quizName ? quizName.style.display = 'none' : null;
const quizPoints = document.querySelector('[nqy-quiz="points"]');
quizPoints ? quizPoints.style.display = 'none' : null;
const leaderboardScreen = document.querySelector('[nqy-quiz="leaderboard-result"]');
leaderboardScreen ? leaderboardScreen.style.display = 'none' : null;

// hiding all questions apart from the first
const quizForms = document.querySelectorAll('[nqy-form]');
const formShowers = document.querySelectorAll('[nqy-formshow]');
quizForms.forEach((quizForm) => {
  turnOffNativeForm(quizForm);
  const questionSteps = quizForm.querySelectorAll('[nqy-step]');
  // find only quiz steps
  let questionsNumber = 0;
  for (let i = 0; i < questionSteps.length; i++) {
    const questionAttribute = questionSteps[i].getAttribute('nqy-step');
    console.log(questionAttribute)
    if (questionAttribute !== 'final') {
      questionsNumber++;
      console.log(questionsNumber)
    }
  }
  // show the total amount of questions
  const totalQuestionsNumbers = quizForm.querySelectorAll('[nqy-question="total"]');
  totalQuestionsNumbers.forEach((totalQuestionsNumber) => {
    totalQuestionsNumber.innerHTML = questionsNumber;
  })
  // create progress bars
  createProgress(quizForm);
  // hide all questions apart the first
  for (let i = 0; i < questionSteps.length; i++) {
    questionSteps[i].style.display = 'none';
    if (i === 0) {
      questionSteps[i].style.display = 'block';
      questionSteps[i].classList.add('current-question');
      if (formShowers.length !== 0) {
        quizForm.style.display = 'none';
      } else {
        checkRequiredFields(questionSteps[i]);
      }
    }
  }
})

// if there are links to show the forms, activate them
function setFormShowers () {
  const formShowers = document.querySelectorAll('[nqy-formshow]');
  if (formShowers) {
    formShowers.forEach((formShower) => {
      if (formShower.tagName !== 'A') return;
      const quizFormName = formShower.getAttribute('nqy-formshow');
      const splashScreen = formShower.closest('[nqy-formshow="formshow"]');
      formShower.addEventListener('click', function () {
        showForm(quizFormName, splashScreen);
      });
    })
  }
}

// show form on form shower link click
function showForm (formName, splashScreen) {
  const quizForms = document.querySelectorAll('[nqy-form]');
  quizForms.forEach((quizForm) => {
    const quizFormName = quizForm.getAttribute('nqy-formshow');
    if (quizFormName === formName) {
      quizForm.style.display = 'block';
      splashScreen.style.display = 'none';
      const currentQuestion = quizForm.querySelector('.current-question');
      checkRequiredFields(currentQuestion);
    }
  })
}

// turn off native webflow forms
function turnOffNativeForm (quizForm) {
  const defaultState = quizForm.getAttribute('nqy-behavior');
  if (!defaultState || defaultState !== 'default') {
    quizForm.addEventListener('submit', handlerCallback, true);
    function handlerCallback (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}

// every time the new question appears, check if there are required fields
// call validatation func on every input change
function checkRequiredFields (currentQuestion) {
  const requiredFields = currentQuestion.querySelectorAll('[required]');
  if (requiredFields.length !== 0) {
    setNextButtonState(false, currentQuestion);
    return Array.from(requiredFields).every(field => {
      if (field.type === 'checkbox' || field.type === 'radio') {
        return field.checked;
      } else if (field.type === 'email') {
        const emailLowerCase = field.value.toLowerCase();
        const emailMatch = emailLowerCase.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
        return emailMatch !== null;
      } else {
        return field.value.trim() !== '';
      }
    });
  } return true;
}

// Check if required inputs are filled on every input change
const currentQuestions = document.querySelectorAll('.current-question');
currentQuestions.forEach(currentQuestion => {
  currentQuestion.addEventListener('input', () => {
    const allFieldsFilled = checkRequiredFields(currentQuestion);
    setNextButtonState(allFieldsFilled, currentQuestion);
  })
})

// Enable/disable the next button based on the allFieldsFilled parameter
function setNextButtonState (allFieldsFilled, currentQuestion) {
  const nextButton = currentQuestion.querySelector('[nqy-action="next"]');
  if (allFieldsFilled) {
    nextButton.style.opacity = '1';
    filledState = true; // this goes to the show next question function
  } else {
    nextButton.style.opacity = '0.6';
    filledState = false;
  }
}

// show validation error
function validationError (currentQuestion) {
  const requiredFields = currentQuestion.querySelectorAll('[required]');
  requiredFields.forEach(field => {
    if (field.type === 'checkbox' || field.type === 'radio') {
      !field.checked ? field.classList.add('nqy-input-error') : field.classList.remove('nqy-input-error');
    } else if (field.type === 'email') {
      const emailLowerCase = field.value.toLowerCase();
      const emailMatch = emailLowerCase.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
      emailMatch == null ? field.classList.add('nqy-input-error') : field.classList.remove('nqy-input-error');
    } else {
      field.value.trim() === '' ? field.classList.add('nqy-input-error') : field.classList.remove('nqy-input-error');
    }
  })
}

// call next question function on each "next question" button click
const nextButtons = document.querySelectorAll('[nqy-action="next"]');
if (nextButtons.length !== 0) {
  nextButtons.forEach((nextButton) => {
    // if we have "next buttons"
    nextButton.addEventListener('click', () => {
      if (userStatus) {
        const quizForm = nextButton.closest('[nqy-form]');
        const nextStepNumber = nextButton.getAttribute('nqy-destination');
        const stepConditional = nextButton.getAttribute('nqy-conditional');
        const currentQuestion = nextButton.closest('.current-question');
        const stepCopyTarget = currentQuestion.querySelectorAll('[nqy-source]');
        // simple logic next step call
        if (nextStepNumber) {
          nextQuestion(nextStepNumber, quizForm);
        }
        if (!nextStepNumber) {
          const currentStep = currentQuestion.getAttribute('nqy-step');
          const currentStepNumber = parseInt(currentStep.match(/\d+/)[0]);
          const nextStepNumber = currentStepNumber + 1;
          let nextStep = 'step-' + nextStepNumber;
          const nextQuestionStep = quizForm.querySelector(`[nqy-step='step-${nextStepNumber}']`);
          !nextQuestionStep ? nextStep = 'final' : null;
          nextQuestion(nextStep, quizForm);
        }
        // conditional logic next step call
        if (stepConditional) {
          findNextQuestion(nextButton);
        }
        // add custom content from inputs
        if (stepCopyTarget) {
          for (let i = 0; i < stepCopyTarget.length; i++) {
            addCustomContent(stepCopyTarget[i]);
          }
        }
      } else { showError('Please, upgrade the plan') }
    })
  })
}

// call previous question function on each "previous question" button click
const previousButtons = document.querySelectorAll('[nqy-action="previous"]')
if (previousButtons.length !== 0) {
  previousButtons.forEach((el) => {
    const quizForm = el.closest('[nqy-form]');
    el.addEventListener('click', function () {
      previousQuestion(quizForm);
    })
  })
}

// show next question
function nextQuestion (stepNumber, quizForm) {
  const currentQuestion = quizForm.querySelector('.current-question');
  if (filledState) {
    savePoints(currentQuestion);
    saveTotalAnswers(currentQuestion);
    saveAnswerText(currentQuestion);
    const existingStepFlow = sessionStorage.getItem('stepFlow');
    existingStepFlow ? sessionStorage.setItem('stepFlow', `${existingStepFlow},${stepNumber}`) : sessionStorage.setItem('stepFlow', `step-1,${stepNumber}`);
    currentQuestion.classList.remove('current-question');
    currentQuestion.style.display = 'none';
    if (stepNumber === 'final') {
      showResult();
    } else {
      const nextQuestion = quizForm.querySelector(`[nqy-step='${stepNumber}']`);
      nextQuestion.classList.add('current-question');
      nextQuestion.style.display = 'block';
      checkRequiredFields(nextQuestion);
      currentQuestionNumber(nextQuestion, stepNumber);
    }
    updateProgress(stepNumber, quizForm);
  } else { validationError(currentQuestion) }
}

// show conditional next question
function findNextQuestion (currentQuestionNextButton) {
  const currentQuestion = currentQuestionNextButton.closest('[nqy-step]');
  const radioButtons = currentQuestion.querySelectorAll('input[type="radio"]');
  for (let i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked) {
      const stepNumber = radioButtons[i].getAttribute('nqy-destination');
      const quizForm = radioButtons[i].closest('[nqy-form]');
      nextQuestion(stepNumber, quizForm);
    }
  }
}

// show previous question
function previousQuestion (quizForm) {
  // find previous step
  const existingStepFlow = sessionStorage.getItem('stepFlow');
  const existingStepFlowArray = existingStepFlow.split(',');
  const previousQuestionNumber = existingStepFlowArray.at(-2);
  // changes in the UI
  const previousQuestion = quizForm.querySelector(`[nqy-step='${previousQuestionNumber}']`);
  const currentQuestion = quizForm.querySelector('.current-question');
  previousQuestion.classList.add('current-question');
  previousQuestion.style.display = 'block';
  currentQuestion.classList.remove('current-question');
  currentQuestion.style.display = 'none';
  currentQuestionNumber(previousQuestion, previousQuestionNumber);
  updateProgress(previousQuestionNumber, quizForm);
  // delete previous step from session storage
  const newStepFlowArray = existingStepFlowArray.splice(-1);
  const newStepFlow = newStepFlowArray.toString();
  sessionStorage.setItem('stepFlow', `${newStepFlow}`);
  // delete last text answer from session storage
  const existingAnswers = sessionStorage.getItem('all-answers');
  const existingAnswersArray = existingAnswers.split(',');
  const newAnswersArray = existingAnswersArray.splice(-1);
  const newAnswers = newAnswersArray.toString();
  sessionStorage.setItem('all-answers', `${newAnswers}`);
  deleteResults();
}

// show current question number
function currentQuestionNumber (currentQuestion, stepNumber) {
  const currentQuestionNumberText = currentQuestion.querySelector('[nqy-question="current"]');
  currentQuestionNumberText ? currentQuestionNumberText.innerHTML = parseInt(stepNumber.match(/\d+/)[0]) : null;
}

// add script for the circle progress bar
let bar;
function addProgressCircleScript (callback) {
  const circleProgressBarScript = document.createElement('script');
  circleProgressBarScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/progressbar.js/1.0.0/progressbar.min.js';
  document.head.appendChild(circleProgressBarScript);
  circleProgressBarScript.addEventListener('load', function () {
    const progressCircleIcon = document.querySelector('[nqy-progress="progress-circle-element"]');
    const progressCircleColorActive = window.getComputedStyle(progressCircleIcon).getPropertyValue('border-color');
    const progressCircleWidth = Number(window.getComputedStyle(progressCircleIcon).getPropertyValue('border-width').replace(/em|rem|px|ch|vw|vh|%/g, ''));
    let progressCircleColor = progressCircleColorActive.replace(/rgb/i, 'rgba');
    progressCircleColor = progressCircleColor.replace(/\)/i, ',0.3)');
    document.querySelector('[nqy-progress="progress-circle-element"]').style.display = 'none';
    bar = new ProgressBar.Circle('[nqy-progress="progress-circle"]', {
      strokeWidth: progressCircleWidth,
      easing: 'easeOut',
      duration: 400,
      color: progressCircleColorActive,
      trailColor: progressCircleColor,
      trailWidth: progressCircleWidth,
      svgStyle: {
        width: '100%',
        height: '100%',
        position: 'absolute'
      }
    })
    bar.animate(10 / 100);
    if (typeof callback === 'function') {
      callback();
    }
  })
}

// create progress bar
function createProgress (quizForm) {
  const questionSteps = quizForm.querySelectorAll('[nqy-step]');
  let questionNumber = 0;
  let questionAttribute;
  for (let i = 0; i < questionSteps.length; i++) {
    questionAttribute = questionSteps[0].getAttribute('nqy-step');
    if (questionSteps[i].getAttribute('nqy-step') !== 'final') {
      questionNumber++;
    }
  }
  const totalQuestions = questionNumber;
  const progressBarPart = document.querySelector('[nqy-progress="progress-part"]');
  const progressCircleIcon = document.querySelector('[nqy-progress="progress-circle-element"]')
  if (progressBarPart) {
    const progressBarPartElement = progressBarPart.querySelector('[nqy-progress="part-element"]');
    for (let i = 1; i < totalQuestions; i++) {
      const progressBarPartElementCopy = progressBarPartElement.cloneNode(true);
      progressBarPart.appendChild(progressBarPartElementCopy);
    }
    progressBarPartElement.classList.add('active');
    updateProgress(questionAttribute, quizForm);
  }
  if (progressCircleIcon) {
    addProgressCircleScript(() => {
      updateProgress(questionAttribute, quizForm);
    });
  } else {
    updateProgress(questionAttribute, quizForm);
  }
}

// update progress
function updateProgress (stepNumber, quizForm) {
  const progressWrapper = document.querySelector('[nqy-progress="progress"]');
  if (stepNumber === 'final') {
    progressWrapper ? progressWrapper.style.display = 'none' : null;
  } else {
    const currentQuestionNumber = parseInt(stepNumber.match(/\d+/)[0]);
    const questionSteps = quizForm.querySelectorAll('[nqy-step]');
    let questionNumber = 0;
    questionSteps.forEach((questionStep) => {
      if (questionStep.getAttribute('nqy-step') !== 'final') {
        questionNumber++;
      }
    })
    const totalQuestions = questionNumber;
    const progress = (currentQuestionNumber / totalQuestions) * 100;
    const progressBar = document.querySelector('[nqy-progress="progress-bar"]');
    const progressBarCircle = document.querySelector('[nqy-progress="progress-circle"]');
    const progressBarPart = document.querySelector('[nqy-progress="progress-part"]');
    if (progressBar) {
      progressBar.style.width = `${progress}%`
    }
    if (progressBarPart) {
      const progressBarPartElement = progressBarPart.querySelectorAll('[nqy-progress="part-element"]');
      for (let i = 0; i < progressBarPartElement.length; i++) {
        currentQuestionNumber > i ? progressBarPartElement[i].classList.add('active') : null;
      }
    }
    if (progressBarCircle) {
      bar.animate(progress / 100);
      const currentQuestionProgress = progressBarCircle.querySelector('[nqy-progress="current"]');
      const totalQuestionsProgress = progressBarCircle.querySelector('[nqy-progress="total"]');
      currentQuestionProgress.innerHTML = currentQuestionNumber;
      totalQuestionsProgress.innerHTML = totalQuestions;
    }
  }
}

// if we have points, add points results to the sessionStorage
function savePoints (currentQuestion) {
  let currentQuestionPointNumber = 0;
  const currentQuestionPoints = currentQuestion.querySelectorAll('[nqy-points]');
  if (currentQuestionPoints.length !== 0) {
    currentQuestionPoints.forEach((currentQuestionPoint) => {
      if (currentQuestionPoint.type === 'radio' && currentQuestionPoint.checked) {
        const currentQuestionPointAttribute = Number(currentQuestionPoint.getAttribute('nqy-points'));
        currentQuestionPointNumber = currentQuestionPointAttribute;
      }
    })
    const existingPoints = sessionStorage.getItem('points');
    if (existingPoints) {
      return sessionStorage.setItem('points', `${existingPoints},${currentQuestionPointNumber}`);
    }
    return sessionStorage.setItem('points', `${currentQuestionPointNumber}`);
  }
}

// save all answers text to session storage
function saveAnswerText (currentQuestion) {
  const radioButtons = currentQuestion.querySelectorAll('input[type="radio"]');
  let labelText = null;
  for (let i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked) {
      const label = radioButtons[i].nextElementSibling;
      labelText = label.textContent;
    }
  }
  const existingAllAnswers = sessionStorage.getItem('all-answers');
  existingAllAnswers ? sessionStorage.setItem('all-answers', `${existingAllAnswers},${labelText}`) : sessionStorage.setItem('all-answers', `${labelText}`)
}

// if we have total right answers, add them to the sessionStorage
function saveTotalAnswers (currentQuestion) {
  let currentQuestionStateBoolean = 0;
  const currentQuestionStates = currentQuestion.querySelectorAll('[nqy-state]');
  if (currentQuestionStates.length !== 0) {
    currentQuestionStates.forEach((currentQuestionState) => {
      if (currentQuestionState.type === 'radio' && currentQuestionState.checked) {
        const currentQuestionStateAttribute = currentQuestionState.getAttribute('nqy-state');
        currentQuestionStateAttribute ? currentQuestionStateBoolean = currentQuestionStateAttribute : currentQuestionStateBoolean = false;
      }
    })
    const existingState = sessionStorage.getItem('state');
    if (existingState) {
      return sessionStorage.setItem('state', `${existingState},${currentQuestionStateBoolean}`);
    }
    return sessionStorage.setItem('state', `${currentQuestionStateBoolean}`);
  }
}

// if we have points results/right answers, delete them from sessionStorage
function deleteResults () {
  let existingResults = '';
  let existingName;
  if (sessionStorage.getItem('points')) {
    existingResults = sessionStorage.getItem('points');
    existingName = 'points';
  }
  if (sessionStorage.getItem('state')) {
    existingResults = sessionStorage.getItem('state');
    existingName = 'state';
  }
  if (existingResults !== '') {
    const existingPointsArray = existingResults.split(',');
    const newPointsArray = existingPointsArray.splice(-1)
    const newPoints = newPointsArray.toString();
    sessionStorage.setItem(existingName, `${newPoints}`);
  }
}

// if we have points show the custom result message
let inputShowed = false;
function showResult () {
  const allFinalScreens = document.querySelectorAll('[nqy-step="final"]');
  const resultScreens = Array.from(allFinalScreens).filter(element => !element.hasAttribute('nqy-data'));
  const inputScreens = document.querySelectorAll('[nqy-data="data"]');
  const pointNumber = document.querySelectorAll('[nqy-result="points"]');
  const answerNumber = document.querySelectorAll('[nqy-result="answers"]');
  const pointFinalSum = pointSum();
  !sessionStorage.getItem('points') ? sessionStorage.setItem('points', pointFinalSum) : null;
  if (inputScreens.length === 0 || inputShowed === true) {
    inputScreens.forEach((inputScreen) => {
      inputScreen.style.display = 'none';
    });
    if (resultScreens.length === 1) {
      resultScreens[0].style.display = 'block';
    } else {
      const matchingResultScreen = Array.from(resultScreens).find(resultScreen => {
        const minRange = Number(resultScreen.getAttribute('nqy-range-from'));
        const maxRange = Number(resultScreen.getAttribute('nqy-range-to'));
        return minRange <= Number(sessionStorage.getItem('points')) && Number(sessionStorage.getItem('points')) <= maxRange;
      });

      if (matchingResultScreen) {
        matchingResultScreen.style.display = 'block';
      };
    }
    if (pointNumber.length !== 0) {
      for (let i = 0; i < pointNumber.length; i++) {
        pointNumber[i].innerHTML = sessionStorage.getItem('points');
      }
    };
    if (answerNumber.length !== 0) {
      for (let i = 0; i < answerNumber.length; i++) {
        answerNumber[i].innerHTML = sessionStorage.getItem('points');
      }
    };
  } else {
    inputScreens.forEach((inputScreen) => {
      inputScreen.style.display = 'block';
      inputShowed = true;
    });
  }
}

// get the sum of the points/right answers
function pointSum () {
  const pointString = sessionStorage.getItem('points');
  const answerString = sessionStorage.getItem('state');
  let pointSum = 0;
  if (pointString) {
    const pointArray = pointString.split(',');
    for (let i = 0; i < pointArray.length; i++) {
      !isNaN(pointArray[i]) ? pointSum += Number(pointArray[i]) : null;
    }
  }
  if (answerString) {
    const quizPointsItem = document.querySelector('[nqy-quiz="points"]');
    let quizPointsNumber = 0;
    quizPointsItem ? quizPointsNumber = Number(quizPointsItem.innerHTML) : null;
    const answerArray = answerString.split(',');
    for (let i = 0; i < answerArray.length; i++) {
      if (answerArray[i] === 'true') {
        quizPointsNumber !== 0 ? pointSum += quizPointsNumber : pointSum++;
      }
    }
  }
  return pointSum;
}

// if we have personalised content, like name, to reuse in the form text
function addCustomContent (stepCopyTarget) {
  const sourceAttribute = stepCopyTarget.getAttribute('nqy-source');
  const textTargets = document.querySelectorAll('[nqy-target]');
  textTargets.forEach(textTarget => {
    const targetAttribute = textTarget.getAttribute('nqy-target');
    if (sourceAttribute === targetAttribute) {
      textTarget.innerHTML = stepCopyTarget.value;
    }
  })
}

// reload page function
function startOver () {
  window.location.reload();
  sessionStorage.clear();
}

// every "start over" button activates the reload page function
const startOverBtns = document.querySelectorAll('[nqy-action="start-over"]')
if (startOverBtns) {
  startOverBtns.forEach((startOverBtn) => {
    startOverBtn.addEventListener('click', startOver);
  })
}

// custom active class for radio buttons and checkboxed
const radioButtonsAll = document.querySelectorAll('input[type="radio"]');
radioButtonsAll.forEach((radioButton) => {
  radioButton.addEventListener('click', () => {
    for (let i = 0; i < radioButtonsAll.length; i++) {
      radioButtonsAll[i].parentElement.classList.remove('nqy-form-active');
    }
    radioButton.parentElement.classList.add('nqy-form-active');
  })
})
const checkboxAll = document.querySelectorAll('input[type="checkbox"]');
checkboxAll.forEach((checkbox) => {
  checkbox.addEventListener('click', () => {
    for (let i = 0; i < checkboxAll.length; i++) {
      const checkboxWrapper = checkboxAll[i].parentElement;
      !checkboxAll[i].checked ? checkboxWrapper.classList.remove('nqy-form-active') : checkboxWrapper.classList.add('nqy-form-active');
    }
  })
})

// getting the final data for the db
function getDbData () {
  let userName, userEmail, quizName, totalPoints, userAnswers;
  const currentUserId = document.querySelector('script[data-quiz-id]').getAttribute('data-quiz-id');
  sessionStorage.getItem('points') ? totalPoints = sessionStorage.getItem('points') : totalPoints = 'null';
  sessionStorage.getItem('all-answers') ? userAnswers = sessionStorage.getItem('all-answers') : userAnswers = 'null';
  document.querySelector('[nqy-quiz="user-name"]') ? userName = document.querySelector('[nqy-quiz="user-name"]').value : userName = 'null';
  document.querySelector('[nqy-quiz="user-email"]') ? userEmail = document.querySelector('[nqy-quiz="user-email"]').value : userEmail = 'null';
  document.querySelector('[nqy-quiz="quiz-name"]') ? quizName = document.querySelector('[nqy-quiz="quiz-name"]').innerHTML : quizName = 'undefined';
  sessionStorage.setItem('current-email', userEmail);
  sendPoints(userName, userEmail, quizName, totalPoints, userAnswers, currentUserId);
}

if (document.querySelector('[nqy-quiz="submit"]')) {
  document.querySelector('[nqy-quiz="submit"]').addEventListener('click', getDbData);
}

// sending the user results to the db
function sendPoints (userName, userEmail, quizName, totalPoints, userAnswers, currentUserId) {
  const finalData = {
    total_points: Number(totalPoints),
    name: userName,
    email: userEmail,
    answers: userAnswers,
    member_uuid: currentUserId,
    quiz_name: quizName
  };

  const url = `${apiUrl}/create_participant`
  fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(finalData)
  })
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      return response.text().then((text) => {
        throw new Error(text);
      })
    })
    .catch((error) => {
      showError(error.message);
    })
    .finally(() => {
      showResult();
    })
};

// show the leaderboard
function showLeaderboard () {
  const leaderboardScreen = document.querySelector('[nqy-quiz="leaderboard-result"]');
  const finalScreens = document.querySelectorAll('[nqy-step="final"]');
  const currentUserId = document.querySelector('script[data-quiz-id]').getAttribute('data-quiz-id');
  const quizName = document.querySelector('[nqy-quiz="quiz-name"]').innerHTML;
  const resultScreen = document.querySelector('[nqy-quiz="leaderboard-wrapper"]');
  const url =
        `${apiUrl}/member_current/${currentUserId}/${quizName}`
  fetch(url, {
    method: 'GET'
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      return response.json().then((text) => {
        throw new Error(text);
      })
    })
    .then((data) => {
      const leaderboardParent = document.querySelector('[nqy-quiz="leaderboard"]');
      const leaderboardClass = leaderboardParent.className;
      const newParent = document.createElement('div');
      newParent.className = leaderboardClass;
      resultScreen.appendChild(newParent);
      const leaderboardPositionTemplate = document.querySelector('[nqy-quiz="leaderboard-position"]').outerHTML;
      const leaderboardNameTemplate = document.querySelector('[nqy-quiz="leaderboard-name"]').outerHTML;
      const leaderboardScoreTemplate = document.querySelector('[nqy-quiz="leaderboard-score"]').outerHTML;
      const leaderboardItemTemplate = document.querySelector('[nqy-quiz="leaderboard-item"]').outerHTML;
      const leaderboardItemTemplateStyle = document.querySelector('[nqy-quiz="leaderboard-item"]');

      const leaderboardItemTemplateClassList = leaderboardItemTemplateStyle.classList;

      let leaderboardItemClass;
      for (let i = 0; i < leaderboardItemTemplateClassList.length; i++) {
        leaderboardItemClass = +`.${leaderboardItemTemplateClassList[i]}`
      }
      let originalResultColor = window.getComputedStyle(leaderboardItemTemplateStyle).getPropertyValue('background-color');
      originalResultColor = originalResultColor.replace(/[rgba()]/g, '');
      const lastCommaIndex = originalResultColor.lastIndexOf(',');
      originalResultColor = originalResultColor.substring(0, lastCommaIndex);

      let loopTime;
      data.length < 11 ? loopTime = data.length : loopTime = 10;
      const currentEmailLocalStorage = localStorage.getItem('current-email') // ADD EMAIL TO LOCAL STORAGE!!!
      const currentParticipant = currentEmailLocalStorage;
      for (let i = 0; i < data.length; i++) {
        if (currentParticipant === data[i].email) {
          const currentParticipantDb = data[i];
          if (i > loopTime) {
            const newCurrentParent = document.createElement('div');
            newCurrentParent.className = leaderboardClass;
            newCurrentParent.style.marginTop = '1.5rem';
            resultScreen.appendChild(newCurrentParent);
            const leaderboardPositionCurrent = document.querySelector('[nqy-quiz="leaderboard-position"]');
            leaderboardPositionCurrent.innerHTML = i + 1;

            const leaderboardPositionCurrentDiv = leaderboardPositionCurrent.outerHTML;

            const leaderboardNameCurrent = document.querySelector('[nqy-quiz="leaderboard-name"]');
            leaderboardNameCurrent.classList.add('clone');
            leaderboardNameCurrent.innerHTML = data[i].name;
            const leaderboardNameCurrentDiv = leaderboardNameCurrent.outerHTML;

            const leaderboardScoreCurrent = document.querySelector('[nqy-quiz="leaderboard-score"]');
            leaderboardScoreCurrent.innerHTML = data[i].total_points;
            const leaderboardScoreCurrentDiv = leaderboardScoreCurrent.outerHTML;

            const leaderboardItemCurrent = leaderboardItemTemplate.replace(leaderboardPositionTemplate, leaderboardPositionCurrentDiv).replace(leaderboardNameTemplate, leaderboardNameCurrentDiv).replace(leaderboardScoreTemplate, leaderboardScoreCurrentDiv);
            newCurrentParent.innerHTML = leaderboardItemCurrent;
          }
        }
      }
      for (let i = 0; i < loopTime; i++) {
        const leaderboardPosition = document.querySelector('[nqy-quiz="leaderboard-position"]');
        leaderboardPosition.innerHTML = i + 1;

        const leaderboardPositionDiv = leaderboardPosition.outerHTML;

        const leaderboardName = document.querySelector('[nqy-quiz="leaderboard-name"]');
        leaderboardName.classList.add('clone');
        leaderboardName.innerHTML = data[i].name;
        const leaderboardNameDiv = leaderboardName.outerHTML;

        const leaderboardScore = document.querySelector('[nqy-quiz="leaderboard-score"]');
        leaderboardScore.innerHTML = data[i].total_points;
        const leaderboardScoreDiv = leaderboardScore.outerHTML;

        const leaderboardItem = leaderboardItemTemplate.replace(leaderboardPositionTemplate, leaderboardPositionDiv).replace(leaderboardNameTemplate, leaderboardNameDiv).replace(leaderboardScoreTemplate, leaderboardScoreDiv);
        newParent.innerHTML += leaderboardItem;
      };
      leaderboardParent.remove();
      const allResultItems = document.querySelectorAll(leaderboardItemClass);
      if (originalResultColor !== 'rgba(0, 0, 0, 0)') {
        for (let i = 0; i < allResultItems.length; i++) {
          allResultItems[0].style.backgroundColor = 'rgba(0, 0, 0, 0)';
          allResultItems[1].style.backgroundColor = 'rgba(' + originalResultColor + ', 0.1)';
          allResultItems[2].style.backgroundColor = 'rgba(' + originalResultColor + ', 0.3)';
          if (i > 2) {
            allResultItems[i].style.backgroundColor = 'rgba(' + originalResultColor + ')';
          }
        }
      }
      leaderboardScreen.style.display = 'flex';
      finalScreens.forEach((finalScreen) => {
        finalScreen.style.display = 'none';
      });
    })
    .catch((error) => {
      showError(error.message)
    })
};

const showLeaderboardBtns = document.querySelectorAll('[nqy-quiz="show-leaderboard"]')
if (showLeaderboardBtns) {
  for (let i = 0; i < showLeaderboardBtns.length; i++) {
    showLeaderboardBtns[i].addEventListener('click', showLeaderboard)
  }
}

// creating custom toast error message
function createToastMessage () {
  const toastError = document.querySelector('.toast-message');
  if (!toastError) {
    const toastMessage = document.createElement('div');
    toastMessage.classList.add('toast-message');
    toastMessage.style.position = 'fixed';
    toastMessage.style.bottom = '2%';
    toastMessage.style.left = '50%';
    toastMessage.style.marginLeft = '-25%';
    toastMessage.style.width = '50%';
    toastMessage.style.backgroundColor = '#CC0000';
    toastMessage.style.color = '#ffffff';
    toastMessage.style.padding = '1.5rem';
    toastMessage.style.textAlign = 'center';
    toastMessage.style.display = 'none';
    document.body.appendChild(toastMessage);
  }
}

// custom error toast message display
function showError (value) {
  const toastError = document.querySelector('.toast-message');
  toastError.innerHTML = value;
  toastError.style.display = 'block';
  setTimeout(function () {
    toastError.style.display = 'none';
  }, 2000)
}

// clear session storage on load
document.addEventListener('DOMContentLoaded', () => {
  const currentUserId = document.querySelector('script[data-quiz-id]').getAttribute('data-quiz-id');
  getMemberStatus(currentUserId);
  createToastMessage();
  sessionStorage.clear();
})
