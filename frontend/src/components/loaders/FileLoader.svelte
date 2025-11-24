
<style>
    .finnaload {
  width: 38px;
  height: 38px;
  display: inline-block;
  position: relative;
}
.finnaload::after,
.finnaload::before {
  content: '';  
  box-sizing: border-box;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid #cacaca;
  position: absolute;
  left: 0;
  top: 0;
  animation: animloader 2s linear infinite;
}
.finnaload::after {
  animation-delay: 1s;
}

@keyframes animloader {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
</style>
<span class="finnaload"></span>