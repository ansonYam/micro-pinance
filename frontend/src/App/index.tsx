import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Borrowers from './components/Borrowers';
import Lenders from './components/Lenders';
import SignIn from './components/SignIn';
import BorrowerCard from './components/BorrowerCard';

// we will put stuff in here to signify that the tx is for a repayment etc
// what does a transaction on this blockchain even look like?
type MyPaymentMetadata = {};

type AuthResult = {
    accessToken: string,
    user: {
        uid: string,
        username: string,
        wallet_address: string
    }
};

export type User = AuthResult['user'];

interface PaymentDTO {
    amount: number,
    user_uid: string,
    created_at: string,
    identifier: string,
    metadata: Object,
    memo: string,
    status: {
        developer_approved: boolean,
        transaction_verified: boolean,
        developer_completed: boolean,
        cancelled: boolean,
        user_cancelled: boolean,
    },
    to_address: string,
    transaction: null | {
        txid: string,
        verified: boolean,
        _link: string,
    },
};

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
    const [user, setUser] = useState<User | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [section, setSection] = useState('home');
    const [borrowers, setBorrowers] = useState([]);

    const signIn = async () => {
        const scopes = ['username', 'payments', 'wallet_address'];
        const authResult: AuthResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
        signInUser(authResult);
        setUser(authResult.user);
    }

    const signOut = () => {
        setUser(null);
        signOutUser();
    }

    const signInUser = (authResult: AuthResult) => {
        axiosClient.post('/user/signin', { authResult });
        return setShowModal(false);
    }

    const signOutUser = () => {
        return axiosClient.get('/user/signout');
    }

    const onModalClose = () => {
        setShowModal(false);
    }

    const payBorrower = async () => {
        if (user === null) {
            return setShowModal(true);
        };
        axiosClient.post('/payments/make_payment', config);
    }

    const onIncompletePaymentFound = (payment: PaymentDTO) => {
        console.log("onIncompletePaymentFound", payment);
        return axiosClient.post('/payments/incomplete', { payment });
    }

    const onReadyForServerApproval = (paymentId: string) => {
        console.log("onReadyForServerApproval", paymentId);
        axiosClient.post('/payments/approve', { paymentId }, config);
    }

    const onReadyForServerCompletion = (paymentId: string, txid: string) => {
        console.log("onReadyForServerCompletion", paymentId, txid);
        axiosClient.post('/payments/complete', { paymentId, txid }, config);
    }

    const onCancel = (paymentId: string) => {
        console.log("onCancel", paymentId);
        return axiosClient.post('/payments/cancelled_payment', { paymentId });
    }

    const onError = (error: Error, payment?: PaymentDTO) => {
        console.log("onError", error);
        if (payment) {
            console.log(payment);
            // handle the error accordingly
        }
    }

    const handleClick = (e: any) => {
        setSection(e.target.id);
    };

    const handleSubmit = () => {
        return axiosClient.post('/submissions/submitText');
    }

    const fetchSubmissions = async () => {
        const response = await axiosClient.get('/submissions/submissions');
        return response.data;
    }

    useEffect(() => {
        fetchSubmissions().then(data => setBorrowers(data));
    }, []);

    return (
        <div className="App">
            <header>
                <Header
                    user={user}
                    onSignIn={signIn}
                    onSignOut={signOut} />
                <button id="borrowers" onClick={handleClick}>Borrowers</button>
                <button id="lenders" onClick={handleClick}>Lenders</button>
            </header>
            <main className="App-main">
                {section === 'borrowers' &&
                    <Borrowers
                        handleSubmit={() => handleSubmit}
                    />}
                {section === 'lenders' &&
                <div>
                    <Lenders
                        borrowers={borrowers}
                        entriesPerPage={10}
                    />
                    <div id="test-A2U">
                        <p>We should be paying users here. Let's try it!</p>
                        <button id="a2u-payment" onClick={() => payBorrower()}>Pay User</button>
                    </div>
                </div>
                }
            </main>
            {showModal && <SignIn onSignIn={signIn} onModalClose={onModalClose} />}
        </div>
    );
}

/**<BorrowerCard 
    name="Coco"
    description="I will use the loan to buy a nicer oven, in order to bake more pies"
    loanAmount={3.14}
    pictureURL="https://images.unsplash.com/photo-1629228136815-0fedb1808520"
    pictureCaption="Picture by Kelcie Herald - https://unsplash.com/photos/K_GkRKJJE-I."
    onClickLoan={() => payBorrower("", 3.14, {})}
/>*/