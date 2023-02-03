import React, { useState } from 'react';
import axios from 'axios';
import Borrowers from './components/Borrowers';
import Lenders from './components/Lenders';

interface WindowWithEnv extends Window {
    __ENV?: {
        backendURL: string, // REACT_APP_BACKEND_URL environment variable
        sandbox: "true" | "false", // REACT_APP_SANDBOX_SDK environment variable - string, not boolean!
    }
}

const _window: WindowWithEnv = window;
const backendURL = _window.__ENV && _window.__ENV.backendURL;

const axiosClient = axios.create({ baseURL: `${backendURL}`, timeout: 20000, withCredentials: true });
const config = { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };

export default function App() {
    const [section, setSection] = useState('home');

    const handleClick = (e: any) => {
        setSection(e.target.id);
    };

    const handleChange = () => {}

    const handleSubmit = () => {}

    const viewSubmissions = () => {}

    return (
        <div className="App">
            <header className="App-header">
                <button id="borrowers" onClick={handleClick}>Borrowers</button>
                <button id="lenders" onClick={handleClick}>Lenders</button>
            </header>
            <main className="App-main">
                {section === 'borrowers' && 
                <Borrowers 
                    handleChange={() => handleChange}
                    handleSubmit={() => handleSubmit}
                />}
                {section === 'lenders' && 
                <Lenders 
                    viewSubmissions={() => viewSubmissions}
                />}
            </main>
        </div>
    );
}