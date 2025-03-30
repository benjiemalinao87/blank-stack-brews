import React from "react";
import { DraggableWindow } from "../window/DraggableWindow";
import ContactsPageV2 from "./ContactsPageV2.jsx";

const ContactV2Window = ({ onClose }) => {
  return (
    <DraggableWindow
      title="My Contacts"
      onClose={onClose}
      defaultSize={{ width: 1200, height: 700 }}
      minSize={{ width: 800, height: 500 }}
    >
      <ContactsPageV2 />
    </DraggableWindow>
  );
};

export default ContactV2Window;
