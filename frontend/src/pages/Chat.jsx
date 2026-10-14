import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import PageContainer from '../components/layout/PageContainer';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import LoadingSpinner from '../components/common/LoadingSpinner';

import {
  streamChatQuestion,
  getChatSessions,
  getChatMessages
} from '../services/chatService';

import { getDocuments } from '../services/documentService';

import {
  Sparkles,
  HelpCircle,
  FileText,
  ClipboardCheck,
  Lightbulb
} from 'lucide-react';


const suggestionCards = [
  {
    icon: HelpCircle,
    title: 'Explain this topic simply',
    prompt:
      'Explain the reflection and refraction of light in simple terms.'
  },
  {
    icon: FileText,
    title: 'Summarize my notes',
    prompt:
      'Can you provide a concise summary of Optics?'
  },
  {
    icon: ClipboardCheck,
    title: 'Create quiz questions',
    prompt:
      'Generate practice quiz questions based on physics optics.'
  },
  {
    icon: Lightbulb,
    title: 'Give me an example',
    prompt:
      'Give me a real-world practical example of Snell’s law in action.'
  }
];


const Chat = () => {

  // ============================================================
  // URL PARAMETER (Moved to the top before usage)
  // ============================================================
  const [searchParams] = useSearchParams();
  const documentIdFromUrl = searchParams.get('document');

  // ============================================================
  // CHAT STATE
  // ============================================================
  const documentId = searchParams.get('document');
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [activeDocumentId, setActiveDocumentId] = useState(
    documentId ? Number(documentId) : null
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // ============================================================
  // DOCUMENT STATE
  // ============================================================

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [selectedDoc, setSelectedDoc] = useState('All Documents');

  // ============================================================
  // CHAT HISTORY STATE
  // ============================================================

  const [chatSessions, setChatSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // ============================================================
  // UI STATE
  // ============================================================

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // ============================================================
  // REFS
  // ============================================================

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);


  // ============================================================
  // LOAD INITIAL DATA
  // ============================================================

  useEffect(() => {
    fetchInitialData();
  }, []);


  const fetchInitialData = async () => {

    // ----------------------------------------------------------
    // Load documents
    // ----------------------------------------------------------

    try {

      const docs = await getDocuments();

      setDocuments(docs || []);

    } catch (err) {

      console.error(
        'Failed to load documents:',
        err
      );

    } finally {

      setDocumentsLoading(false);
    }


    // ----------------------------------------------------------
    // Load chat sessions
    // ----------------------------------------------------------

    try {

      const sessions = await getChatSessions();

      setChatSessions(sessions || []);

    } catch (err) {

      console.error(
        'Failed to load chat sessions:',
        err
      );

    } finally {

      setSessionsLoading(false);
    }
  };


  // ============================================================
  // REFRESH CHAT SESSIONS
  // ============================================================

  const refreshSessions = async () => {

    try {

      const sessions = await getChatSessions();

      setChatSessions(sessions || []);

    } catch (err) {

      console.error(
        'Failed to refresh sessions:',
        err
      );
    }
  };


  // ============================================================
  // SELECT EXISTING CHAT SESSION
  // ============================================================

  const handleSelectChatSession = async (selectedId) => {
    if (selectedId === sessionId || isStreaming) return;

    const selectedSession = chatSessions.find(
      (session) => session.id === selectedId
    );

    setSessionId(selectedId);

    setActiveDocumentId(
      selectedSession?.document_id ?? null
    );

    setMessagesLoading(true);

    try {
      const rawMessages = await getChatMessages(selectedId);

      const formattedMessages = (rawMessages || []).map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        sources: []
      }));

      setMessages(formattedMessages);

    } catch (err) {
      console.error(
        `Failed to load messages for session ${selectedId}:`,
        err
      );
    } finally {
      setMessagesLoading(false);
    }
  };


  // ============================================================
  // SCROLL TO BOTTOM
  // ============================================================

  const scrollToBottom = () => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };


  useEffect(() => {

    scrollToBottom();

  }, [
    messages,
    isThinking,
    isStreaming
  ]);


  // ============================================================
  // GET CURRENT DOCUMENT ID
  // ============================================================

  const getSelectedDocumentId = () => {

    // If Chat was opened from "Ask AI" on a document,
    // use the document ID from the URL.

    if (documentIdFromUrl) {

      return Number(documentIdFromUrl);
    }


    // If user manually selected a document
    // from the ChatHeader dropdown.

    if (
      selectedDoc &&
      typeof selectedDoc === 'object' &&
      selectedDoc.id
    ) {

      return Number(selectedDoc.id);
    }


    // All Documents

    return null;
  };


  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const handleSendMessage = async (text) => {

    if (
      !text.trim() ||
      isStreaming
    ) {
      return;
    }


    // ----------------------------------------------------------
    // Current document
    // ----------------------------------------------------------

    const selectedDocumentId =
      getSelectedDocumentId();


    // ----------------------------------------------------------
    // User message
    // ----------------------------------------------------------

    const userMessage = {

      id: Date.now(),

      role: 'user',

      content: text
    };


    // ----------------------------------------------------------
    // Temporary assistant message
    // ----------------------------------------------------------

    const assistantMsgId =
      Date.now() + 1;


    const initialAssistantMessage = {

      id: assistantMsgId,

      role: 'assistant',

      content: '',

      sources: []
    };


    // ----------------------------------------------------------
    // Add messages immediately
    // ----------------------------------------------------------

    setMessages((prev) => [

      ...prev,

      userMessage,

      initialAssistantMessage

    ]);


    setIsStreaming(true);

    setIsThinking(true);


    // ----------------------------------------------------------
    // Abort controller
    // ----------------------------------------------------------

    const controller =
      new AbortController();


    abortControllerRef.current =
      controller;


    try {

      await streamChatQuestion({

        question: text,

        sessionId: sessionId,

        documentId: activeDocumentId,

        signal: controller.signal,


        // ======================================================
        // STREAM TOKEN
        // ======================================================

        onToken: (chunk) => {

          setIsThinking(false);


          setMessages((prevMessages) =>

            prevMessages.map((msg) =>

              msg.id === assistantMsgId

                ? {
                    ...msg,

                    content:
                      msg.content + chunk
                  }

                : msg
            )
          );
        },


        // ======================================================
        // STREAM COMPLETE
        // ======================================================

        onDone: ({
          sessionId: returnedSessionId,
          sources
        }) => {

          // Backend creates a session
          // when sessionId was null.

          if (returnedSessionId) {

            setSessionId(
              returnedSessionId
            );

            refreshSessions();
          }


          // Attach sources to assistant message

          setMessages((prevMessages) =>

            prevMessages.map((msg) =>

              msg.id === assistantMsgId

                ? {
                    ...msg,

                    sources:
                      sources || []
                  }

                : msg
            )
          );


          setIsStreaming(false);

          setIsThinking(false);

          abortControllerRef.current =
            null;
        },


        // ======================================================
        // STREAM ERROR
        // ======================================================

        onError: (error) => {

          if (
            error.name === 'AbortError'
          ) {

            console.log(
              'Stream cancelled by user.'
            );

          } else {

            console.error(
              'Error during streaming:',
              error
            );


            const userFacingError =
              error.message ||
              'Unable to connect to the Study AI server.';


            setMessages(
              (prevMessages) =>

                prevMessages.map(
                  (msg) =>

                    msg.id ===
                    assistantMsgId

                      ? {
                          ...msg,

                          content:
                            msg.content
                              ? `${msg.content}\n\n⚠️ ${userFacingError}`
                              : `⚠️ ${userFacingError}`
                        }

                      : msg
                )
            );
          }


          setIsStreaming(false);

          setIsThinking(false);

          abortControllerRef.current =
            null;
        }
      });

    } catch (error) {

      console.error(
        'Unexpected chat error:',
        error
      );

      setIsStreaming(false);

      setIsThinking(false);

      abortControllerRef.current =
        null;
    }
  };


  // ============================================================
  // STOP STREAM
  // ============================================================

  const handleStopStream = () => {

    if (
      abortControllerRef.current
    ) {

      abortControllerRef.current.abort();
    }
  };


  // ============================================================
  // NEW CHAT
  // ============================================================

  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStream();
    }

    setMessages([]);
    setSessionId(null);
    setActiveDocumentId(null);
    setIsStreaming(false);
    setIsThinking(false);
  };

  // ============================================================
  // SUGGESTION CLICK
  // ============================================================

  const handleSuggestionClick = (
    promptText
  ) => {

    handleSendMessage(
      promptText
    );
  };


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <PageContainer>

      <div className="chat-container">


        {/* =====================================================
            LEFT SIDEBAR
        ====================================================== */}

        <ChatSidebar

          showMobile={
            showMobileSidebar
          }

          onHideMobile={() =>
            setShowMobileSidebar(false)
          }

          sessions={
            chatSessions
          }

          sessionsLoading={
            sessionsLoading
          }

          onNewChat={
            handleNewChat
          }

          onSelectChat={
            handleSelectChatSession
          }

          activeSessionId={
            sessionId
          }

        />


        {/* =====================================================
            MAIN CHAT AREA
        ====================================================== */}

        <div className="chat-main-area">


          {/* ===================================================
              HEADER
          ==================================================== */}

          <ChatHeader

            onToggleMobileSidebar={() =>
              setShowMobileSidebar(
                (prev) => !prev
              )
            }

            documents={
              documents
            }

            documentsLoading={
              documentsLoading
            }

            selectedDoc={
              selectedDoc
            }

            onSelectDoc={(doc) =>
              setSelectedDoc(doc)
            }

          />


          {/* ===================================================
              MESSAGES AREA
          ==================================================== */}

          <div className="chat-messages-area">


            {/* -------------------------------------------------
                LOADING OLD CONVERSATION
            -------------------------------------------------- */}

            {messagesLoading ? (

              <LoadingSpinner
                label="Loading conversation history..."
              />

            ) : messages.length === 0 ? (


              /* ------------------------------------------------
                 EMPTY CHAT
              ------------------------------------------------- */

              <div className="chat-empty-state">

                <div
                  className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-primary-subtle text-primary mb-3"
                  style={{
                    backgroundColor:
                      'var(--primary-light)'
                  }}
                >

                  <Sparkles
                    size={32}
                  />

                </div>


                <h2 className="fs-4 fw-bold text-dark mb-2">

                  How can I help you study?

                </h2>


                <p
                  className="text-secondary fs-6 mb-4"
                  style={{
                    maxWidth: '480px',
                    margin: '0 auto'
                  }}
                >

                  Ask questions about your
                  uploaded documents, concepts,
                  formulas, or practice topics.

                </p>


                {/* --------------------------------------------
                    SUGGESTIONS
                --------------------------------------------- */}

                <div className="row g-3 text-start">

                  {suggestionCards.map(
                    (card, idx) => {

                      const Icon =
                        card.icon;


                      return (

                        <div
                          key={idx}
                          className="col-12 col-sm-6"
                        >

                          <div
                            className="suggestion-card"
                            onClick={() =>
                              handleSuggestionClick(
                                card.prompt
                              )
                            }
                          >

                            <div className="d-flex align-items-center gap-2 mb-2">

                              <Icon
                                size={18}
                                className="text-primary"
                              />

                              <span className="fw-semibold text-dark fs-7">

                                {card.title}

                              </span>

                            </div>


                            <p
                              className="text-secondary fs-7 mb-0"
                              style={{
                                fontSize:
                                  '0.8125rem'
                              }}
                            >

                              "{card.prompt}"

                            </p>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

            ) : (


              /* ------------------------------------------------
                 ACTUAL MESSAGES
              ------------------------------------------------- */

              <>

                {messages.map((msg) => {


                  // --------------------------------------------
                  // Typing indicator
                  // --------------------------------------------

                  if (
                    msg.role ===
                      'assistant' &&
                    !msg.content &&
                    isThinking
                  ) {

                    return (

                      <TypingIndicator
                        key={msg.id}
                      />

                    );
                  }


                  // --------------------------------------------
                  // Regular message
                  // --------------------------------------------

                  if (msg.content) {

                    return (

                      <ChatMessage

                        key={msg.id}

                        message={msg}

                        onRegenerate={() => {

                          const previousUserMessage =
                            messages[
                              messages.length - 2
                            ]?.content ||
                            'Explain again';


                          handleSendMessage(
                            previousUserMessage
                          );
                        }}

                      />

                    );
                  }


                  return null;

                })}


                <div
                  ref={messagesEndRef}
                />

              </>

            )}

          </div>


          {/* ===================================================
              CHAT INPUT
          ==================================================== */}

          <ChatInput

            onSendMessage={
              handleSendMessage
            }

            isStreaming={
              isStreaming
            }

            onStop={
              handleStopStream
            }

            disabled={
              messagesLoading
            }

          />

        </div>

      </div>

    </PageContainer>
  );
};


export default Chat;