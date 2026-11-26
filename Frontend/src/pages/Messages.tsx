import axios from "axios";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import api from "../utils/api";

type Contact = {
  _id: string;
  name?: string;
  email?: string;
  role: "adopter" | "shelter" | "foster";
};

type Message = {
  _id: string;
  subject: string;
  body: string;
  createdAt: string;
  senderId: Contact;
  recipientId: Contact;
  petId?: { _id: string; name: string } | null;
};

const getMessageError = (requestError: unknown, fallback: string) => {
  if (!axios.isAxiosError<{ message?: string }>(requestError)) {
    return fallback;
  }

  if (requestError.response?.status === 404) {
    return "The messages API is missing from the configured backend. Deploy the latest backend before using messaging.";
  }

  return requestError.response?.data?.message || fallback;
};

function Messages() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const [contactsResponse, messagesResponse] = await Promise.all([
      api.get<{ contacts: Contact[] }>("/messages/contacts", config),
      api.get<{ messages: Message[] }>("/messages", config),
    ]);

    return {
      contacts: contactsResponse.data.contacts || [],
      messages: messagesResponse.data.messages || [],
    };
  }, []);

  useEffect(() => {
    let active = true;
    void fetchData()
      .then((data) => {
        if (!active) return;
        setContacts(data.contacts);
        setMessages(data.messages);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(getMessageError(requestError, "Unable to load messages."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchData]);

  const load = useCallback(async () => {
    try {
      const data = await fetchData();
      setContacts(data.contacts);
      setMessages(data.messages);
      setError("");
    } catch (requestError: unknown) {
      setError(getMessageError(requestError, "Unable to load messages."));
    }
  }, [fetchData]);

  const selectedContact = contacts.find(
    (contact) => contact._id === selectedContactId
  );
  const conversation = useMemo(
    () =>
      messages
        .filter(
          (message) =>
            message.senderId?._id === selectedContactId ||
            message.recipientId?._id === selectedContactId
        )
        .sort(
          (first, second) =>
            new Date(first.createdAt).getTime() -
            new Date(second.createdAt).getTime()
        ),
    [messages, selectedContactId]
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    setStatus("");
    setError("");

    if (!selectedContactId) {
      setError("Choose a shelter or conversation contact first.");
      return;
    }
    if (!body.trim()) {
      setError("Message body is required.");
      return;
    }

    setSending(true);
    try {
      await api.post(
        "/messages",
        {
          recipientId: selectedContactId,
          subject: subject.trim(),
          body: body.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setSubject("");
      setBody("");
      setStatus("Message sent successfully.");
      await load();
    } catch (requestError: unknown) {
      setError(getMessageError(requestError, "Unable to send message."));
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Messages</h1>
      {status && (
        <p role="status" className="mb-4 rounded bg-green-100 p-3 text-green-800">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 rounded bg-red-100 p-3 text-red-800">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="mb-8 grid gap-3 rounded-xl bg-white p-6 shadow">
        <label htmlFor="message-contact" className="font-semibold">
          {contacts.some((contact) => contact.role === "shelter")
            ? "Choose a shelter or conversation"
            : "Choose a conversation"}
        </label>
        <select
          id="message-contact"
          required
          value={selectedContactId}
          onChange={(event) => setSelectedContactId(event.target.value)}
          className="rounded border p-3"
        >
          <option value="">Select a contact</option>
          {contacts.map((contact) => (
            <option key={contact._id} value={contact._id}>
              {contact.name || contact.email || "Unknown user"} ({contact.role})
            </option>
          ))}
        </select>
        <input
          maxLength={120}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Subject (optional)"
          className="rounded border p-3"
        />
        <textarea
          required
          minLength={1}
          maxLength={2000}
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a message"
          className="rounded border p-3"
        />
        <button
          disabled={sending || !selectedContactId}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send Message"}
        </button>
      </form>

      {loading ? (
        <p>Loading messages...</p>
      ) : contacts.length === 0 ? (
        <p className="rounded-xl bg-white p-5 shadow">
          No contacts are available yet. Shelter conversations will appear here.
        </p>
      ) : !selectedContact ? (
        <p className="rounded-xl bg-white p-5 shadow">
          Select a contact to view the conversation.
        </p>
      ) : conversation.length === 0 ? (
        <p className="rounded-xl bg-white p-5 shadow">
          No messages with {selectedContact.name || selectedContact.email} yet.
        </p>
      ) : (
        <section aria-label={`Conversation with ${selectedContact.name || selectedContact.email}`} className="space-y-4">
          <h2 className="text-xl font-bold">
            Conversation with {selectedContact.name || selectedContact.email}
          </h2>
          {conversation.map((message) => (
            <article key={message._id} className="rounded-xl bg-white p-5 shadow">
              <h3 className="font-bold">{message.subject}</h3>
              <p className="text-sm text-gray-500">
                From {message.senderId?.name || message.senderId?.email || "Unknown sender"} to{" "}
                {message.recipientId?.name || message.recipientId?.email || "Unknown recipient"}
                {" · "}
                {new Date(message.createdAt).toLocaleString()}
              </p>
              {message.petId?.name && (
                <p className="mt-1 text-sm text-gray-600">About {message.petId.name}</p>
              )}
              <p className="mt-3 whitespace-pre-wrap">{message.body}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default Messages;
