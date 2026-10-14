import api, { TOKEN_KEY } from './api';


/* =========================================================
   GET CHAT SESSIONS
========================================================= */

export const getChatSessions = async () => {
  const response = await api.get('/chat/sessions');

  return response.data;
};


/* =========================================================
   GET MESSAGES FOR A CHAT SESSION
========================================================= */

export const getChatMessages = async (sessionId) => {
  const response = await api.get(
    `/chat/sessions/${sessionId}/messages`
  );

  return response.data;
};


/* =========================================================
   STREAM CHAT QUESTION
========================================================= */

export const streamChatQuestion = async ({
  question,
  sessionId = null,
  documentId = null,
  signal,
  onToken,
  onDone,
  onError
}) => {

  try {

    const token = localStorage.getItem(TOKEN_KEY);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/chat/stream`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify({
          question,
          session_id: sessionId ?? null,
          document_id: documentId ?? null
        }),

        signal
      }
    );


    /* -------------------------------------------------------
       Check HTTP response
    ------------------------------------------------------- */

    if (!response.ok) {

      let errorMessage =
        'Failed to connect to the chat server.';

      try {

        const errorData =
          await response.json();

        errorMessage =
          errorData.detail || errorMessage;

      } catch {
        // Ignore JSON parsing error
      }

      throw new Error(errorMessage);
    }


    /* -------------------------------------------------------
       Check streaming body
    ------------------------------------------------------- */

    if (!response.body) {

      throw new Error(
        'Streaming response is not available.'
      );
    }


    /* -------------------------------------------------------
       Start reading stream
    ------------------------------------------------------- */

    const reader =
      response.body.getReader();

    const decoder =
      new TextDecoder();

    let buffer = '';


    while (true) {

      const {
        value,
        done
      } = await reader.read();


      if (done) {
        break;
      }


      buffer += decoder.decode(
        value,
        {
          stream: true
        }
      );


      const events =
        buffer.split('\n\n');


      buffer =
        events.pop() || '';


      /* -----------------------------------------------------
         Process SSE events
      ----------------------------------------------------- */

      for (const event of events) {

        const line =
          event
            .split('\n')
            .find(
              (line) =>
                line.startsWith('data:')
            );


        if (!line) {
          continue;
        }


        const jsonString =
          line.replace(
            /^data:\s*/,
            ''
          );


        try {

          const data =
            JSON.parse(jsonString);


          /* -------------------------------------------------
             Token
          ------------------------------------------------- */

          if (data.type === 'token') {

            onToken?.(
              data.content
            );
          }


          /* -------------------------------------------------
             Stream completed
          ------------------------------------------------- */

          if (data.type === 'done') {

            onDone?.({
              sessionId:
                data.session_id,

              sources:
                data.sources || []
            });
          }

        } catch (parseError) {

          console.error(
            'Failed to parse streaming event:',
            parseError
          );
        }
      }
    }

  } catch (error) {

    onError?.(error);
  }
};