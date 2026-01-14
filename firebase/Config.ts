import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrDSyPmclU3Sz0MfECJHzkbM6YXTui6Zk",
  authDomain: "huoltohommeli.firebaseapp.com",
  projectId: "huoltohommeli",
  storageBucket: "huoltohommeli.firebasestorage.app",
  messagingSenderId: "59928390205",
  appId: "1:59928390205:web:c1e7069313a34840e51854"
};

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export { auth 

  
}


