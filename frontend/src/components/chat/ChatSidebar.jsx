import React, { useMemo, useState } from 'react';
import { Offcanvas, Spinner } from 'react-bootstrap';
import useAuth from '../../hooks/useAuth';
import {
  Plus,
  Search,
  MessageSquare,
  Sparkles,
  X
} from 'lucide-react';


// ============================================================
// GROUP SESSIONS BY DATE
// ============================================================

const groupSessionsByDate = (sessions) => {
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const yesterday = new Date(today);

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  const sevenDaysAgo = new Date(today);

  sevenDaysAgo.setDate(
    sevenDaysAgo.getDate() - 7
  );


  const groups = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: []
  };


  sessions.forEach((session) => {

    const sessionDate =
      new Date(session.created_at);


    if (sessionDate >= today) {

      groups.Today.push(session);

    } else if (sessionDate >= yesterday) {

      groups.Yesterday.push(session);

    } else if (sessionDate >= sevenDaysAgo) {

      groups['Previous 7 Days'].push(session);

    } else {

      groups.Older.push(session);
    }
  });


  return groups;
};


// ============================================================
// CHAT SIDEBAR CONTENT
// ============================================================

export const ChatSidebarContent = ({
  sessions = [],
  sessionsLoading = false,
  onNewChat,
  onSelectChat,
  activeSessionId = null
}) => {

  const { user } = useAuth();

  const [
    searchQuery,
    setSearchQuery
  ] = useState('');


  // ==========================================================
  // USER INITIALS
  // ==========================================================

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'AI';


  // ==========================================================
  // SEARCH CONVERSATIONS
  // ==========================================================

  const filteredSessions = useMemo(() => {

    const query =
      searchQuery
        .trim()
        .toLowerCase();


    // No search query
    // → show everything

    if (!query) {

      return sessions;
    }


    return sessions.filter((session) => {

      const title =
        session.title ||
        'Untitled Chat';


      return title
        .toLowerCase()
        .includes(query);

    });

  }, [
    sessions,
    searchQuery
  ]);


  // ==========================================================
  // GROUP FILTERED SESSIONS
  // ==========================================================

  const grouped =
    useMemo(
      () =>
        groupSessionsByDate(
          filteredSessions
        ),
      [filteredSessions]
    );


  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  const handleClearSearch = () => {

    setSearchQuery('');
  };


  return (

    <div className="d-flex flex-column h-100">


      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="chat-sidebar-header">


        {/* New Chat */}

        <button
          className="btn-primary-sa w-100 justify-content-center py-2 fs-7"
          onClick={onNewChat}
        >

          <Plus size={16} />

          <span>
            New Chat
          </span>

        </button>


        {/* ====================================================
            SEARCH
        ===================================================== */}

        <div className="position-relative">

          <Search
            size={14}
            className="position-absolute top-50 translate-middle-y text-muted"
            style={{
              left: '10px'
            }}
          />


          <input
            type="text"
            className="form-control form-control-sm ps-4 pe-5 py-1.5 fs-7 border-0 bg-white"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
            style={{
              borderRadius:
                'var(--radius-sm)'
            }}
          />


          {/* Clear button */}

          {searchQuery && (

            <button
              type="button"
              className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent text-muted p-1 me-1"
              onClick={
                handleClearSearch
              }
              aria-label="Clear search"
            >

              <X size={14} />

            </button>

          )}

        </div>


        {/* Search result count */}

        {searchQuery && !sessionsLoading && (

          <div
            className="text-muted mt-1"
            style={{
              fontSize: '0.68rem'
            }}
          >

            {filteredSessions.length}{' '}

            {filteredSessions.length === 1
              ? 'conversation'
              : 'conversations'}{' '}

            found

          </div>

        )}

      </div>


      {/* ======================================================
          CHAT HISTORY
      ======================================================= */}

      <div className="chat-history-scroll">


        {/* Loading */}

        {sessionsLoading ? (

          <div className="text-center py-4 text-muted fs-7">

            <Spinner
              animation="border"
              size="sm"
              className="me-2"
            />

            <span>
              Loading history...
            </span>

          </div>


        ) : filteredSessions.length === 0 ? (

          /* ==================================================
             EMPTY SEARCH RESULT
          =================================================== */

          <div className="text-center py-4 text-muted fs-7">

            <MessageSquare
              size={20}
              className="mb-2 opacity-50"
            />

            <div>

              {searchQuery
                ? 'No conversations found'
                : 'No chat sessions yet'}

            </div>

            {searchQuery && (

              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none p-0 mt-2"
                onClick={
                  handleClearSearch
                }
              >

                Clear search

              </button>

            )}

          </div>


        ) : (

          /* ==================================================
             GROUPED HISTORY
          =================================================== */

          Object.keys(grouped).map(
            (groupName) => {

              const groupItems =
                grouped[groupName];


              if (
                groupItems.length === 0
              ) {
                return null;
              }


              return (

                <div
                  key={groupName}
                >

                  {/* Group title */}

                  <div className="chat-history-group-label">

                    {groupName}

                  </div>


                  {/* Sessions */}

                  <div className="d-flex flex-column gap-1 mt-1">

                    {groupItems.map(
                      (item) => (

                        <div
                          key={item.id}
                          className={`chat-history-item ${
                            item.id === activeSessionId
                              ? 'active'
                              : ''
                          }`}
                          onClick={() =>
                            onSelectChat &&
                            onSelectChat(
                              item.id
                            )
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {

                            if (
                              e.key ===
                              'Enter'
                            ) {

                              onSelectChat &&
                                onSelectChat(
                                  item.id
                                );
                            }

                          }}
                        >

                          <MessageSquare
                            size={15}
                            className="chat-item-icon"
                          />


                          <span className="text-truncate">

                            {item.title ||
                              'Untitled Chat'}

                          </span>

                        </div>

                      )
                    )}

                  </div>

                </div>

              );
            }
          )

        )}

      </div>


      {/* ======================================================
          USER PROFILE
      ======================================================= */}

      <div className="chat-sidebar-footer">

        <div className="d-flex align-items-center gap-2 overflow-hidden">


          {/* Avatar */}

          <div
            className="user-avatar-circle flex-shrink-0"
            style={{
              width: 30,
              height: 30,
              fontSize: '0.75rem'
            }}
          >

            {initials}

          </div>


          {/* User details */}

          <div className="user-info-meta">

            <div
              className="user-name-text"
              style={{
                fontSize: '0.8125rem'
              }}
            >

              {user?.name ||
                'Student'}

            </div>


            <div
              className="user-email-text"
              style={{
                fontSize: '0.6875rem'
              }}
            >

              {user?.email ||
                'user@study.ai'}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};


// ============================================================
// CHAT SIDEBAR
// ============================================================

const ChatSidebar = ({
  showMobile,
  onHideMobile,
  sessions = [],
  sessionsLoading = false,
  onNewChat,
  onSelectChat,
  activeSessionId
}) => {

  return (

    <>


      {/* ======================================================
          DESKTOP SIDEBAR
      ======================================================= */}

      <div className="chat-sidebar-panel">

        <ChatSidebarContent

          sessions={
            sessions
          }

          sessionsLoading={
            sessionsLoading
          }

          onNewChat={
            onNewChat
          }

          onSelectChat={
            onSelectChat
          }

          activeSessionId={
            activeSessionId
          }

        />

      </div>


      {/* ======================================================
          MOBILE SIDEBAR
      ======================================================= */}

      <Offcanvas
        show={showMobile}
        onHide={onHideMobile}
        responsive="lg"
        className="d-lg-none"
        style={{
          maxWidth: '290px',
          backgroundColor:
            'var(--bg-primary)'
        }}
      >

        <Offcanvas.Header
          closeButton
          className="border-bottom py-2"
        >

          <div className="d-flex align-items-center gap-2">

            <Sparkles
              size={16}
              className="text-primary"
            />

            <span className="fw-semibold fs-7">

              Chat History

            </span>

          </div>

        </Offcanvas.Header>


        <Offcanvas.Body className="p-0">

          <ChatSidebarContent

            sessions={
              sessions
            }

            sessionsLoading={
              sessionsLoading
            }

            onNewChat={() => {

              onNewChat();

              onHideMobile();

            }}

            onSelectChat={(id) => {

              if (onSelectChat) {

                onSelectChat(id);
              }

              onHideMobile();

            }}

            activeSessionId={
              activeSessionId
            }

          />

        </Offcanvas.Body>

      </Offcanvas>

    </>
  );
};


export default ChatSidebar;