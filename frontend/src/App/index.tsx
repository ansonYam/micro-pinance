import React, { FormEvent, useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import SignIn from './components/SignIn';
import Borrowers from './components/Borrowers';
import Lenders from './components/Lenders';
import { Loan } from './types/loan';
import { Contribution } from './types/contribution';

type MyPaymentMetadata = {
};

type ContribsByLoanId = {
    [loanId: string]: Contribution[];
}

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
    const [loans, setLoans] = useState([]);
    const [outstandingLoans, setOutstandingLoans] = useState<Contribution[]>([]);
    const [loansToBeRepaid, setLoansToBeRepaid] = useState<ContribsByLoanId>({});

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

    const onIncompletePaymentFound = (payment: PaymentDTO) => {
        console.log("onIncompletePaymentFound", payment);
        return axiosClient.post('/payments/incomplete', { payment });
    }

    /**
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
    */

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
            const response = await axiosClient.post('/loans/submitloanRequest', data, config);
            console.log(response);
        } catch (error) {
            console.error(error);
        }
    }

    const handleLoanClick = async (loan: Loan, loanAmount: number) => {
        if (user === null) {
            return setShowModal(true);
        }

        let amount = loanAmount;
        console.log("Loan amount: ", amount);
        let memo = `Loan payment intended for user ${loan.borrower}`;
        let metadata = { loan_recipient: loan.borrower, loan_id: loan._id };

        const paymentData = {
            amount,
            memo,
            metadata,
        };

        const callbacks = {
            onReadyForServerApproval: (paymentId: string) => {
                console.log("onReadyForServerApproval", paymentId);
                return axiosClient.post('/payments/approve', { paymentId }, config);
            },
            onReadyForServerCompletion: (paymentId: string, txid: string, loanId: string, amount: number) => {
                // console.log("onReadyForServerCompletion", paymentId, txid, metadata.loan_id, paymentData.amount);
                return axiosClient.post('/payments/complete', { paymentId, txid, loanId: metadata.loan_id, amount: paymentData.amount }, config);
            },
            onCancel: (paymentId: string) => {
                console.log("onCancel", paymentId);
                return axiosClient.post('/payments/cancelled_payment', { paymentId });
            },
            onError,
        }

        const payment = await window.Pi.createPayment(paymentData, callbacks).then(function (payment: any) {
            console.log("payment from Pi.createPayment: ", payment);
        }).catch(function (error: any) {
            console.error(error);
        })
    }

    const handleRepayLoan = async (loanId: string, amount: number, contributions: Contribution[]) => {
        if (user === null) {
            return setShowModal(true);
        }
        let loanAmount = amount;
        let memo = `Loan repayment for ${loanId}`;
        let metadata = { loanId: loanId };

        const paymentData = {
            loanAmount,
            memo,
            metadata,
        };

        console.log("paymentData: ", paymentData); // up to here is fine

        const callbacks = {
            onReadyForServerApproval: (paymentId: string) => {
                console.log("onReadyForServerApproval", paymentId);
                return axiosClient.post('/repayments/approve', { paymentId }, config);
            },
            onReadyForServerCompletion: (paymentId: string, txid: string, loanId: string, amount: number) => {
                console.log("onReadyForServerCompletion", paymentId, txid, loanId, amount);
                return axiosClient.post('/repayments/complete', { paymentId, txid, loanId: loanId, amount: amount }, config);
            },
            onCancel: (paymentId: string) => {
                console.log("onCancel", paymentId);
                return axiosClient.post('/repayments/cancelled_payment', { paymentId });        
            },
            onError,
        }

        const payment = await window.Pi.createPayment(paymentData, callbacks).then(function (payment: any) {
            console.log("payment from Pi.createPayment: ", payment);
        }).catch(function (error: any) {
            console.error(error);
        })
    }

    const fetchLoans = async () => {
        const response = await axiosClient.get('/loans/getLoanRequests');
        return response.data;
    }

    useEffect(() => {
        fetchLoans().then(data => setLoans(data));
    }, [user]);

    const getUserLoans = async () => {
        try {
            const response = await axiosClient.get('/payments/matching_user');
            setOutstandingLoans(response.data);
            // console.log(response);
        } catch (err) {
            console.error(err);
        }
    }

    const getRecipientLoans = async () => {
        try {
            const response = await axiosClient.get('/payments/matching_recipient');
            const contributions = response.data;

            // Group orders by product_id
            const loansToBeRepaid = contributions.reduce((acc: ContribsByLoanId, contribution: Contribution) => {
                if (!acc[contribution.loan_id]) {
                    acc[contribution.loan_id] = [contribution];
                } else {
                    acc[contribution.loan_id].push(contribution);
                }
                return acc;
            }, {});
            // console.log(loansToBeRepaid, typeof loansToBeRepaid);
            setLoansToBeRepaid(loansToBeRepaid);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        if (user) {
            getUserLoans();
            getRecipientLoans();
        }
    }, [user]);

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
                        loansToBeRepaid={loansToBeRepaid}
                        handleRepayLoan={handleRepayLoan}
                        handleSubmit={handleSubmit}
                    />}
                {section === "lenders" &&
                    <div>
                        <Lenders
                            outstandingLoans={outstandingLoans}
                            loans={loans}
                            entriesPerPage={10}
                            handleLoanClick={({ loan, loanAmount }) =>
                                handleLoanClick(loan, loanAmount)
                            }
                        />
                    </div>
                }
            </main>
            {showModal && <SignIn onSignIn={signIn} onModalClose={onModalClose} />}
        </div>
    );
}