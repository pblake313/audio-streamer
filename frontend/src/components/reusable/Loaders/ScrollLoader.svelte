<span class="mousejoint"></span>

<style>
  .mousejoint {
    width: 28px;
    height: 48px;
    box-sizing: border-box;
    border: 2px solid #fff;
    position: relative;
    border-radius: 50% 50% 50% 50% / 25% 25% 25% 25%;
    margin: auto;
    display: block;
    background-color: rgba(0, 0, 0, 0.194);
    box-shadow: 0px 0px 5px black;
  }

  .mousejoint::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 20%;
    transform: translate(-50%, 0);
    width: 5px;
    height: 5px;
    background: #fff;
    border-radius: 50%;
    animation: fadeDown 1.5s ease-out infinite;
  }

  @keyframes fadeDown {
    0% {
      top: 20%;
      opacity: 1;
    }
    50% {
      top: 50%;
      opacity: 0.5;
    }
    100% {
      top: 80%;
      opacity: 0;
    }
  }
</style>
