import React, { CSSProperties } from "react";
import { User } from "../";

interface Props {
  onSignIn: () => void;
  onSignOut: () => void;
  user: User | null,
}

const headerStyle: CSSProperties = {
  padding: 8,
  backgroundColor: "gray",
  color: "white",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

export default function Header(props: Props) {
  return (
    <header style={headerStyle}>
      <div style={{ fontWeight: "bold" }}>Micro-Pinance</div>

      <div>
        {props.user === null ? (
          <button onClick={props.onSignIn}>Sign in</button>
        ) : (
          <div>
            @{props.user.username} <br></br>
            User UId: {props.user.uid}
            <button type="button" onClick={props.onSignOut}>Sign out</button>
          </div>
        )}
      </div>
    </header>
  );
}
