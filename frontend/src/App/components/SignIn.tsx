import React from 'react';

interface Props {
  onSignIn: () => void,
  onModalClose: () => void,
}

export default function SignIn(props: Props) {
  return (
    <div>
      <p>You need to sign in first.</p>
      <div>
        <button onClick={props.onSignIn} style={{ marginRight: '1em' }}>Sign in</button>
        <button onClick={props.onModalClose}>Close</button>
      </div>
    </div>
  )
}