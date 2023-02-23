import React, { FormEvent, useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import SignIn from './components/SignIn';
import Borrowers from './components/Borrowers';
import Lenders from './components/Lenders';
import { Borrower } from './components/Lenders';

type MyPaymentMetadata = {
    loan_recipient: string,
};

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

    // A2U payment
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

    const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        if (user === null) {
            return setShowModal(true);
        };

        const loanAmount = event.currentTarget.loanAmount.value;
        const businessDescription = event.currentTarget.businessDescription.value;
        const data = { loanAmount, businessDescription };
        try {
            const response = await axiosClient.post('/submissions/submitText', data, config);
            console.log(response);
        } catch (error) {
            console.error(error);
        }
    }

    const handleLoanClick = async (borrower: Borrower, ) => {
        if (user === null) {
            return setShowModal(true);
        }

        let amount = borrower.amount;
        let memo = `Loan payment intended for user ${borrower.user}`;
        let metadata = { loan_recipient: borrower.user};

        const paymentData = {
            amount,
            memo,
            metadata,
        };

        const callbacks = {
            onReadyForServerApproval,
            onReadyForServerCompletion,
            onCancel,
            onError,
        }

        const payment = await window.Pi.createPayment(paymentData, callbacks).then(function (payment: any) {
            console.log("payment from Pi.createPayment: ", payment);
        }).catch(function (error: any) {
            console.error(error);
        })
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
                    onSignOut={signOut}
                />
                <button id="about" onClick={handleClick}>About</button>
                <button id="borrowers" onClick={handleClick}>Borrowers</button>
                <button id="lenders" onClick={handleClick}>Lenders</button>
            </header>
            <main className="App-main">
                {section === "about" &&
                    <div>
                        Welcome to Micro-Pinance, a peer-to-peer micro-lending platform that connects borrowers and lenders around the world.
                    </div>
                }
                {section === "borrowers" &&
                    <Borrowers
                        handleSubmit={handleSubmit}
                    />}
                {section === "lenders" &&
                    <div>
                        <Lenders
                            borrowers={borrowers}
                            entriesPerPage={10}
                            handleLoanClick={handleLoanClick}
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