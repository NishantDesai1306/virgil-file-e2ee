import { EThree } from '@virgilsecurity/e3kit-browser';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const e3 = useRef(null);
  const [msg, setMsg] = useState("");
  const createGetToken = identity => async () => {
    const {
      data: {
        virgilToken
      }
    } = await axios.get(`/jwt?identity=${identity}`);

    console.log('received token', virgilToken);
    return virgilToken;
  }
  const getGroup = async () => {
    let group = null;

    try {
      group = await e3.current.createGroup("testingGroupA");
      debugger;
      console.log("group created");
    }
    catch (e) {
      group = await e3.current.getGroup("testingGroupA");
      debugger;
      console.log("group loaded");
    }

    return group;
  }

  useEffect(() => {
    EThree.initialize(createGetToken("userA")).then(async (eThree) => {
      e3.current = eThree;
      const isRegistered = await eThree.hasLocalPrivateKey();

      if (!isRegistered) {
        await eThree.register();
      }
    });
  }, []);

  function arrayBufferToString(arrayBuffer) {
    return String.fromCharCode.apply(null, arrayBuffer);
  }
  function stringToArrayBuffer(str) {
    const bufView = new Uint8Array(str.length);

    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }

    return bufView;
  }

  const getB64String = (file) => {
    return new Promise((resolve, reject) => {
      var FR = new FileReader();

      FR.addEventListener("load", function (e) {
        resolve(e.target.result);
      });

      FR.readAsDataURL(file);
    });
  }

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    let formData = new FormData();
    const { encryptedSharedFile, fileKey } = await e3.current.encryptSharedFile(file);
    const eFileKeyString = arrayBufferToString(fileKey);
    const eGroup = await getGroup();
    const encryptedFileKeyForGroup = await eGroup.encrypt(eFileKeyString);

    formData.append("file", encryptedSharedFile);
    debugger;

    await axios.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      }
    });

    const downloadUrl = `/files/${encryptedSharedFile.name}`;
    const response = await axios.get(downloadUrl);
    debugger;
    const blob = new Blob([response.data]);
    const f = new File([blob], "f4.jpg");
    debugger;
    const dGroup = await getGroup();
    debugger;
    const userCard = await e3.current.findUsers(e3.current.identity);
    debugger;
    const dFileKeyString = await dGroup.decrypt(encryptedFileKeyForGroup, userCard);
    const dFileKey = stringToArrayBuffer(dFileKeyString);
    debugger;
    const decryptedFile = await e3.current.decryptSharedFile(f, dFileKey);
    debugger;
    const msg = await getB64String(decryptedFile);
    setMsg(msg);
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Computer 1
        </p>

        <input
          type="file"
          onChange={handleUpload}
        />

        {
          msg && (
            <img src={msg} alt="file" />
          )
        }
      </header>
    </div>
  );
}

export default App;
