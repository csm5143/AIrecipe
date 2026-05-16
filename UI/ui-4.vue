<style scoped>
  .toy-camera-container {
    --cam-main: #00d2d3;
    --cam-dark: #01a3a4;
    --cam-accent: #ff9f43;
    --cam-shutter: #ff4757;
    --photo-bg: #ffffff;
    --toy-size: 5.5em;
    --elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);

    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6em;
    background-color: #f7f1e3;
    border-radius: 4em;
    user-select: none;
  }

  .toy-camera-wrapper {
    position: relative;
    width: var(--toy-size);
    height: calc(var(--toy-size) * 0.9);
    perspective: 1200px;
    cursor: pointer;
  }

  .toy-camera-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toy-camera-body {
    position: absolute;
    inset: 0;
    background: var(--cam-main);
    border-radius: 1.2em;
    transform-style: preserve-3d;
    transform: translateZ(20px);
    transition: all 0.5s var(--elastic);
    box-shadow:
      0 0.6em 0 var(--cam-dark),
      0 1em 2em rgba(0, 0, 0, 0.15),
      inset 0 0.2em 0.3em rgba(255, 255, 255, 0.4);
    z-index: 10;
  }

  .toy-camera-body::before {
    content: "";
    position: absolute;
    top: 20%;
    left: 0;
    width: 100%;
    height: 15%;
    background: var(--cam-accent);
    box-shadow: inset 0 0.1em 0.2em rgba(0, 0, 0, 0.1);
  }

  .toy-camera-button {
    position: absolute;
    top: -0.6em;
    right: 15%;
    width: 1.2em;
    height: 0.8em;
    background: var(--cam-shutter);
    border-radius: 0.3em 0.3em 0 0;
    box-shadow:
      0 0.2em 0 #cc3643,
      inset 0 0.1em 0.1em rgba(255, 255, 255, 0.3);
    transition: all 0.2s ease;
  }

  .toy-camera-lens {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 60%;
    height: 65%;
    background: #2d3436;
    border-radius: 50%;
    transform: translate(-50%, -40%) translateZ(15px);
    border: 0.3em solid var(--cam-dark);
    box-shadow:
      0 0.4em 0.8em rgba(0, 0, 0, 0.3),
      inset 0 0.2em 0.5em rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .toy-camera-lens::after {
    content: "";
    position: absolute;
    top: 15%;
    left: 20%;
    width: 30%;
    height: 20%;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: rotate(-25deg);
  }

  .toy-camera-photo {
    position: absolute;
    bottom: 10%;
    left: 50%;
    width: 75%;
    height: 80%;
    background: var(--photo-bg);
    border-radius: 0.4em;
    transform: translateX(-50%) translateZ(-10px) translateY(0);
    transition: all 0.7s var(--elastic);
    box-shadow:
      0 0.2em 0.5em rgba(0, 0, 0, 0.1),
      inset 0 0 0 0.2em #f1f2f6;
    display: flex;
    flex-direction: column;
    padding: 0.4em;
    opacity: 0;
    z-index: 1;
  }

  .photo-image {
    width: 100%;
    height: 70%;
    background: #74b9ff;
    border-radius: 0.2em;
    position: relative;
    overflow: hidden;
  }

  .photo-image::after {
    content: "";
    position: absolute;
    top: 15%;
    right: 15%;
    width: 0.5em;
    height: 0.5em;
    background: #ffeaa7;
    border-radius: 50%;
  }

  .photo-text {
    width: 60%;
    height: 0.2em;
    background: #dfe6e9;
    margin-top: 0.4em;
    border-radius: 0.1em;
  }

  .toy-camera-wrapper:hover .toy-camera-body {
    transform: translateZ(40px) rotateX(10deg);
  }

  .toy-camera-input:active + .toy-camera-body {
    transform: translateZ(10px) scale(0.95);
  }

  .toy-camera-input:active + .toy-camera-body .toy-camera-button {
    transform: translateY(0.3em);
    box-shadow: 0 0.1em 0 #cc3643;
  }

  .toy-camera-input:checked + .toy-camera-body {
    transform: translateZ(30px) translateY(-10%);
  }

  .toy-camera-input:checked + .toy-camera-body .toy-camera-photo {
    opacity: 1;
    transform: translateX(-50%) translateZ(-30px) translateY(120%) rotate(5deg);
    animation: photo-bounce 0.8s var(--elastic);
  }

  .toy-camera-input:checked + .toy-camera-body .toy-camera-lens::before {
    content: "";
    position: absolute;
    inset: 0;
    background: white;
    opacity: 0;
    animation: lens-flash 0.4s ease-out;
  }

  .toy-camera-input:focus-visible + .toy-camera-body {
    outline: 3px solid #70a1ff;
    outline-offset: 15px;
  }

  @keyframes photo-bounce {
    0% {
      transform: translateX(-50%) translateZ(-30px) translateY(0);
    }
    100% {
      transform: translateX(-50%) translateZ(-30px) translateY(120%) rotate(5deg);
    }
  }

  @keyframes lens-flash {
    0% {
      opacity: 1;
      transform: scale(0.1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.5);
    }
    100% {
      opacity: 0;
      transform: scale(2);
    }
  }

  .toy-camera-shadow {
    position: absolute;
    bottom: -1em;
    left: 50%;
    width: 90%;
    height: 1.5em;
    background: radial-gradient(circle, rgba(0, 0, 0, 0.15) 0%, transparent 70%);
    transform: translateX(-50%);
    transition: all 0.5s ease;
    pointer-events: none;
  }

  .toy-camera-input:checked ~ .toy-camera-shadow {
    width: 120%;
    opacity: 0.1;
  }
</style>

<template>
  <div class="container">
    <div class="toy-camera-container">
      <label class="toy-camera-wrapper">
        <input type="checkbox" class="toy-camera-input" />
        <div class="toy-camera-body">
          <div class="toy-camera-button"></div>
          <div class="toy-camera-lens"></div>
          <div class="toy-camera-photo">
            <div class="photo-image"></div>
            <div class="photo-text"></div>
            <div class="photo-text" style="width: 40%"></div>
          </div>
        </div>
        <div class="toy-camera-shadow"></div>
      </label>
    </div>
  </div>
</template>
