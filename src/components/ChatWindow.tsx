"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useEncryption } from "@/hooks/useEncryption";
import { useState, useRef, useEffect } from "react";
import AppLogo from "./AppLogo";

export default function ChatWindow({
  conversationId,
  onBackAction,
}: {
  conversationId: Id<"conversations">;
  onBackAction?: () => void;
}) {
  // Ensure generated Convex API is available before using hooks.
  if (!api || !api.messages || !api.typing || !api.users || !api.calls || !api.conversations || !api.requests) {
    return (
      <div className="p-4 text-sm text-red-500">
        Convex API not available. Run `npx convex dev` or `npx convex codegen` and restart the dev server.
      </div>
    );
  }

  const { user } = useAuth();
  const { sendNotification, requestPermission, canNotify } = useNotifications();
  const { encryptMessage: encryptMsg, decryptMessage: decryptMsg, isLoading: encryptionLoading } = useEncryption();
  const messages = useQuery((api.messages as any).getMessages, user ? { conversationId, requesterId: user.userId } : "skip");
  const typingEntries = useQuery((api.typing as any).getTypingForConversation, { conversationId });
  const setTypingMut = useMutation((api.typing as any).setTyping);
  const allUsers = useQuery((api.users as any).getUsers);
  const reactionsByMessage = useQuery((api.messages as any).getReactionsForConversation, { conversationId });

  const sendMessage = useMutation((api.messages as any).sendMessage);
  const markDeliveredMut = useMutation((api.messages as any).markMessageDelivered);
  const markReadMut = useMutation((api.messages as any).markMessageRead);
  const editMessageMut = useMutation((api.messages as any).editMessage);
  const deleteMessageMut = useMutation((api.messages as any).deleteMessage);
  const addReactionMut = useMutation((api.messages as any).addReaction);
  const removeReactionMut = useMutation((api.messages as any).removeReaction);
  const pinMessageMut = useMutation((api.messages as any).pinMessage);
  const unpinMessageMut = useMutation((api.messages as any).unpinMessage);
  const forwardMessageMut = useMutation((api.messages as any).forwardMessage);
  const replyToMessageMut = useMutation((api.messages as any).replyToMessage);
  const deleteConversationMut = useMutation((api.conversations as any).deleteConversation);
  const unfriendUserMut = useMutation((api.users as any).unfriendUser);
  
  const [text, setText] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [decryptedTexts, setDecryptedTexts] = useState<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyToMsg, setReplyToMsg] = useState<any | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [PickerComp, setPickerComp] = useState<any | null>(null);
  
  const EMOJIS = [
    "😀",
    "😂",
    "😍",
    "👍",
    "🙏",
    "🎉",
    "🔥",
    "😢",
    "😮",
    "😎",
    "❤️",
    "👏",
    "🙌",
    "😉",
    "🤔",
  ];
  // Try to dynamically import a full emoji picker library when opened.
  // If the package isn't installed, we'll keep the small built-in grid as a fallback.
  useEffect(() => {
    if (showEmojiPicker && !PickerComp) {
      import("emoji-picker-react")
        .then((m) => {
          // emoji-picker-react exports default component in most versions
          setPickerComp(() => m.default || m);
        })
        .catch(() => {
          // leave PickerComp as null to use fallback
          setPickerComp(null);
        });
    }
  }, [showEmojiPicker, PickerComp]);

  const [prevMessageCount, setPrevMessageCount] = useState(0);

  // Decrypt incoming encrypted messages
  useEffect(() => {
    if (!messages || messages.length === 0 || !decryptMsg) return;
    
    const decryptMessages = async () => {
      const newDecrypted = new Map(decryptedTexts);
      for (const msg of messages) {
        if (msg.encryptedText && msg.encryptionIv && !newDecrypted.has(msg._id)) {
          try {
            const plaintext = await decryptMsg(
              msg.encryptionIv,
              msg.encryptedText,
              conversationId.toString()
            );
            newDecrypted.set(msg._id, plaintext);
          } catch (error) {
            console.error(`Failed to decrypt message ${msg._id}:`, error);
            newDecrypted.set(msg._id, "[Failed to decrypt]");
          }
        }
      }
      setDecryptedTexts(newDecrypted);
    };
    
    decryptMessages();
  }, [messages, conversationId, decryptMsg, decryptedTexts]);

  // Messages with E2E encryption support
  useEffect(() => {
    // Auto-mark messages as delivered when loaded
    if (messages && messages.length > 0) {
      messages.forEach((msg: any) => {
        if (!msg.deliveredTo?.includes(user?.userId) && msg.senderId !== user?.userId) {
          markDeliveredMut({ messageId: msg._id, userId: user?.userId || "" }).catch(() => {});
        }
      });
    }
  }, [messages, user?.userId]);

  // Send notification for new incoming messages
  useEffect(() => {
    if (!messages || !user || !sendNotification) return;
    
    const newMessageCount = messages.length;
    if (newMessageCount > prevMessageCount) {
      const newMessages = messages.slice(prevMessageCount);
      newMessages.forEach((msg: any) => {
        // Only notify if message is from another user
        if (msg.senderId !== user.userId) {
          const senderUser = (allUsers || []).find((u: any) => u.clerkId === msg.senderId);
          const senderName = senderUser?.name || "User";
          const messagePreview = msg.text ? msg.text.substring(0, 50) : `[${msg.mediaType || 'message'}]`;
          
          try {
            sendNotification({
              title: `New message from ${senderName}`,
              body: messagePreview || "New message",
              icon: senderUser?.image || "/icon.png",
              tag: `msg-${conversationId}`,
            }).catch(() => {});
          } catch (e) {
            console.warn("Failed to send notification:", e);
          }
        }
      });
    }
    setPrevMessageCount(newMessageCount);
  }, [messages?.length, user?.userId, allUsers, sendNotification, conversationId]);

  const safeMessages = messages || [];

  // WebRTC call state (manual SDP signaling)
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localSDP, setLocalSDP] = useState<string | null>(null);
  const [remoteSDPInput, setRemoteSDPInput] = useState<string>("");
  const [isCaller, setIsCaller] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<any | undefined>(undefined);
  const createCallOffer = useMutation((api.calls as any).createCallOffer);
  const answerCallMut = useMutation((api.calls as any).answerCall);
  const endCallMut = useMutation((api.calls as any).endCall);
  const incomingCalls = useQuery((api.calls as any).getIncomingCalls, user?.userId ? { calleeId: user?.userId || "" } : "skip");
  const callById = useQuery((api.calls as any).getCallById, currentCallId ? { callId: currentCallId } : "skip");
  const conversation = useQuery((api.conversations as any).getConversationById, { conversationId });
  const [incomingCall, setIncomingCall] = useState<any | null>(null);

  const requestBetween = useQuery((api.requests as any).getRequestBetween, (user?.userId && conversation?.members) ? { userA: user.userId, userB: (conversation?.members || []).find((m: string) => m !== user.userId) || "" } : "skip");
  const createRequestMut = useMutation((api.requests as any).createRequest);
  const acceptRequestMut = useMutation((api.requests as any).acceptRequest);

  const handleSend = async () => {
    // disallow sending until request accepted (if request exists and not accepted)
    const otherId = conversation?.members?.find((m: string) => m !== user?.userId) || null;
    const req = requestBetween as any;
    if (req && req.status !== "accepted") {
      alert("You must send a request and have it accepted before messaging.");
      return;
    }
    if (!text.trim() && !fileObj) return;
    try {
      let mediaUrl: string | undefined = undefined;
      let mediaType: string | undefined = undefined;

      if (fileObj) {
        mediaUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(String(reader.result));
          reader.onerror = rej;
          reader.readAsDataURL(fileObj);
        });
        mediaType = fileObj.type.startsWith("image") ? "image" : fileObj.type.startsWith("video") ? "video" : "file";
      }

      // Encrypt message text if present
      let encryptedText: string | undefined = undefined;
      let encryptionIv: string | undefined = undefined;
      if (text.trim()) {
        try {
          const encrypted = await encryptMsg(text, conversationId.toString());
          encryptedText = encrypted.ciphertext;
          encryptionIv = encrypted.iv;
        } catch (error) {
          console.error("Encryption failed:", error);
          alert("Failed to encrypt message");
          return;
        }
      }

      if (replyToMsg) {
        // sending a reply
        if (!replyToMessageMut) {
          alert('Server functions not available. Run `npx convex dev` and restart the dev server.');
          return;
        }
        await (replyToMessageMut as any)({
          conversationId,
          senderId: user?.userId || "",
          text,
          mediaType,
          mediaUrl,
          replyTo: replyToMsg._id,
          encryptedText,
          encryptionIv,
        });
        setReplyToMsg(null);
      } else {
        // normal message send
        if (!sendMessage) {
          alert('Server functions not available. Run `npx convex dev` and restart the dev server.');
          return;
        }
        await (sendMessage as any)({
          conversationId,
          senderId: user?.userId || "",
          text,
          mediaType,
          mediaUrl,
          encryptedText,
          encryptionIv,
        });
      }
      
      setText("");
      setFileObj(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // notify stopped typing
      if (user?.userId && setTypingMut) {
        try {
          await setTypingMut({ conversationId, userId: user.userId, isTyping: false });
        } catch {}
      }
    } catch (e) {
      console.error(e);
    }
  };

  // typing indicator handling: call setTyping true on input, and clear after debounce
  const startTyping = async () => {
    if (!user?.userId) return;
    try {
      if (setTypingMut) await setTypingMut({ conversationId, userId: user.userId, isTyping: true });
    } catch {}
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      if (user?.userId && setTypingMut) setTypingMut({ conversationId, userId: user.userId, isTyping: false }).catch(() => {});
    }, 1500);
  };

  const hangup = () => {
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    remoteStream?.getTracks().forEach((t) => t.stop());
    setRemoteStream(null);
    setInCall(false);
    setCallType(null);
    setLocalSDP(null);
    setRemoteSDPInput("");
    // stop typing when hanging up
    if (user?.userId && setTypingMut) {
      setTypingMut({ conversationId, userId: user.userId, isTyping: false }).catch(() => {});
    }
  };

  const startCall = async (type: "audio" | "video") => {
    try {
      const constraints = type === "video" ? { audio: true, video: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints as MediaStreamConstraints);
      setLocalStream(stream);
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // attach local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // remote stream
      const remote = new MediaStream();
      setRemoteStream(remote);
      pc.ontrack = (ev) => {
        ev.streams[0].getTracks().forEach((t) => remote.addTrack(t));
      };

      // create data channel (optional)
      try {
        pc.createDataChannel("chat");
      } catch {}

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      setLocalSDP(JSON.stringify(offer));
      setIsCaller(true);
      setInCall(true);
      setCallType(type);

      // if user is signed in, create call offer in Convex so the callee can be notified
      if (user?.userId) {
        try {
          const otherId = conversation?.members?.find((m: string) => m !== user.userId) || "";
          if (createCallOffer) {
            const callId = await createCallOffer({
              callerId: user.userId,
              calleeId: otherId,
              offerSdp: JSON.stringify(offer),
              callType: type,
            });
            setCurrentCallId(callId);
          } else {
            console.warn("Convex call create function not available. Run `npx convex dev`.");
          }
        } catch (e) {
          console.warn("Could not create call record in Convex", e);
        }
      }
    } catch (e) {
      console.error("startCall error", e);
      alert("Could not access media devices.");
    }
  };

  const receiveOfferAndCreateAnswer = async (offerSdpStr: string) => {
    try {
      if (!offerSdpStr || !offerSdpStr.trim()) {
        alert("No SDP provided.");
        return;
      }
      let offer;
      try {
        offer = JSON.parse(offerSdpStr);
      } catch (e) {
        alert("Invalid SDP JSON. Paste the full SDP string.");
        return;
      }
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // get media according to offer (assume video if offer.sdp mentions "m=video")
      const wantVideo = (offer.sdp || "").includes("m=video");
      const constraints = wantVideo ? { audio: true, video: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints as MediaStreamConstraints);
      setLocalStream(stream);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const remote = new MediaStream();
      setRemoteStream(remote);
      pc.ontrack = (ev) => {
        ev.streams[0].getTracks().forEach((t) => remote.addTrack(t));
      };

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      const answerStr = JSON.stringify(answer);
      setLocalSDP(answerStr);
      setIsCaller(false);
      setInCall(true);
      setCallType(wantVideo ? "video" : "audio");
      return answerStr;
    } catch (e) {
      console.error("receiveOfferAndCreateAnswer error", e);
      alert("Failed to handle offer.");
    }
  };

  const acceptAnswerOnCaller = async (answerSdpStr: string) => {
    try {
      if (!pcRef.current) throw new Error("No peer connection");
      if (!answerSdpStr || !answerSdpStr.trim()) {
        alert("No SDP provided.");
        return;
      }
      let answer;
      try {
        answer = JSON.parse(answerSdpStr);
      } catch (e) {
        alert("Invalid SDP JSON. Paste the full SDP string.");
        return;
      }
      await pcRef.current.setRemoteDescription(answer);
      // call established
    } catch (e) {
      console.error("acceptAnswer error", e);
      alert("Failed to accept answer.");
    }
  };

  // Voice message recording handlers
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            if (!sendMessage) {
              alert("Server functions not available. Try refreshing the page.");
              return;
            }
            const audioUrl = String(reader.result);
            console.log("Voice message size:", audioUrl.length);
            await (sendMessage as any)({
              conversationId,
              senderId: user?.userId || "",
              text: undefined,
              mediaType: "audio",
              mediaUrl: audioUrl,
              isVoice: true,
            });
            // notify stopped typing
            if (user?.userId && setTypingMut) {
              try {
                await setTypingMut({ conversationId, userId: user.userId, isTyping: false });
              } catch {}
            }
          } catch (e) {
            console.error("Failed to send voice message:", e);
            alert("Failed to send voice message: " + (e instanceof Error ? e.message : String(e)));
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // stop and cleanup stream
        stream.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
        mediaRecorderRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Failed to start voice recording:", e);
      alert("Could not access microphone: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Watch for incoming calls (callee side)
  useEffect(() => {
    if (incomingCalls && incomingCalls.length > 0) {
      // pick the most recent pending call
      setIncomingCall(incomingCalls[0]);
    }
  }, [incomingCalls]);

  // If we have a callId and we are the caller, watch for answerSdp to be set
  useEffect(() => {
    if (callById && isCaller && (callById as any).answerSdp) {
      // apply remote answer automatically
      acceptAnswerOnCaller((callById as any).answerSdp);
    }
  }, [callById, isCaller]);

  useEffect(() => {
    // clear typing on unmount
    return () => {
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
      if (user?.userId) setTypingMut({ conversationId, userId: user.userId, isTyping: false }).catch(() => {});
    };
  }, []);

  // force re-render periodically so relative timestamps update in real time
  const [, setNowTick] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30 * 1000); // update every 30s
    return () => window.clearInterval(id);
  }, []);

  const formatTimeLabel = (ms: number | undefined) => {
    if (!ms) return "";
    const diff = Date.now() - ms;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const d = new Date(ms);
    return d.toLocaleDateString();
  };

  // When messages arrive, mark them as delivered/read for this user (1:1 chat assumption)
  useEffect(() => {
    if (!safeMessages || !user?.userId) return;
    for (const m of safeMessages) {
      if (m.senderId === user.userId) continue; // only mark incoming messages
      try {
        if (!m.deliveredTo || !m.deliveredTo.includes(user.userId)) {
          markDeliveredMut({ messageId: m._id, userId: user.userId }).catch(() => {});
        }
        // Mark as read when the chat window is visible (simple behavior)
        if (!m.readBy || !m.readBy.includes(user.userId)) {
          markReadMut({ messageId: m._id, userId: user.userId }).catch(() => {});
        }
      } catch (e) {}
    }
  }, [safeMessages, user?.userId]);

  // When an incoming call is accepted, create an answer and send it back via Convex
  useEffect(() => {
    if (!incomingCall) return;
    // show incoming UI to user; user must click accept to run acceptIncoming below
  }, [incomingCall]);

  const acceptIncoming = async (call: any) => {
    try {
      // set currentCallId so we watch it
      setCurrentCallId(call._id);
      // receive offer, create answer and get the answer SDP string back
      const answerSdp = await receiveOfferAndCreateAnswer(call.offerSdp);
      if (answerSdp) {
        if (answerCallMut) {
          await answerCallMut({ callId: call._id, answerSdp });
        } else {
          console.warn('answerCall function not available; run `npx convex dev`.');
        }
      }
      setIncomingCall(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full min-h-screen relative flex flex-col">
      {/* Incoming call banner */}
      {incomingCall && (
        <div className="absolute top-20 z-30 bg-white/90 border rounded p-3 sm:w-80 w-auto inset-x-0 mx-4 sm:mx-0 shadow-lg">
          <div className="font-medium">Incoming {incomingCall.callType} call</div>
          <div className="text-sm text-muted">From: {(() => {
              const u = (allUsers || []).find((x: any) => x.clerkId === incomingCall.callerId);
              return u ? u.name : incomingCall.callerId;
            })()}</div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => acceptIncoming(incomingCall)} className="px-3 py-1 bg-green-500 text-white rounded">Accept</button>
            <button onClick={async () => { try { if (endCallMut) await endCallMut({ callId: incomingCall._id }); } catch {} setIncomingCall(null); }} className="px-3 py-1 bg-gray-100 rounded">Decline</button>
          </div>
        </div>
      )}
      <header className="relative flex items-center px-4 h-16 sm:h-18 md:h-20 border-b">
        {/* left: back + logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onBackAction && (
            <button
              onClick={onBackAction}
              className="sm:hidden p-1 rounded hover:bg-white/20"
              title="Back to chats"
            >
              ←
            </button>
          )}
          <AppLogo />
        </div>
        {/* center: status/typing absolute so it stays perfectly centered */}
        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <div className="truncate text-sm text-muted max-w-[60%]">
            {(typingEntries || [])
              .filter((t: any) => t.userId !== user?.userId && t.isTyping)
              .map((t: any) => {
                const u = (allUsers || []).find((x: any) => x.clerkId === t.userId);
                return u ? u.name : t.userId;
              })
              .slice(0, 2)
              .map((n: any, i: number) => `${n} is typing`)
              .join(", ")}
          </div>
        </div>
        {/* right: actions and request UI */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2 overflow-x-auto z-10">
          {/* Request UI: allow sending/accepting chat requests */}
          {(() => {
            const otherId = conversation?.members?.find((m: string) => m !== user?.userId) || null;
            const req = requestBetween as any;
            if (!user?.userId || !otherId) return null;
            if (!req) {
              return (
                <button
                  onClick={async () => {
                    try {
                      await createRequestMut({ requesterId: user.userId, recipientId: otherId });
                      alert("Request sent");
                    } catch (e) {
                      console.error(e);
                      alert("Failed to send request");
                    }
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                >
                  Send Request
                </button>
              );
            }
            if (req.status === "pending") {
              if (req.requesterId === user.userId) {
                return <div className="text-sm text-muted">Request pending</div>;
              } else {
                return (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await acceptRequestMut({ requestId: req._id });
                          alert("Request accepted");
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="px-3 py-1 bg-green-500 text-white rounded"
                    >
                      Accept
                    </button>
                    <div className="text-sm text-muted">Requested</div>
                  </div>
                );
              }
            }
            if (req.status === "accepted") {
              return <div className="text-sm text-muted">Connected</div>;
            }
            return null;
          })()}
          <button
            title="Start voice call"
            onClick={() => startCall("audio")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v22M4 5c1.5 3 4 5 8 5s6.5-2 8-5" />
            </svg>
          </button>
          <button
            title="Start video call"
            onClick={() => startCall("video")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="15" height="14" rx="2" ry="2" />
              <polygon points="23 7 16 12 23 17 23 7" />
            </svg>
          </button>
          
          {/* Unfriend button */}
          <button
            title="Unfriend"
            onClick={async () => {
              const otherId = conversation?.members?.find((m: string) => m !== user?.userId);
              if (!otherId || !user?.userId) return;
              if (confirm("Are you sure you want to unfriend this user?")) {
                try {
                  await unfriendUserMut({ userId: user.userId, targetUserId: otherId });
                  alert("User unfriended");
                } catch (e) {
                  console.error(e);
                  alert("Failed to unfriend user");
                }
              }
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <path d="M21 8a3 3 0 0 0-3-3" stroke="red" />
            </svg>
          </button>

          {/* Delete conversation button */}
          <button
            title="Delete conversation"
            onClick={async () => {
              if (confirm("Are you sure you want to delete this conversation? This cannot be undone.")) {
                try {
                  await deleteConversationMut({ conversationId, userId: user?.userId || "" });
                  alert("Conversation deleted");
                  // Navigate back to home or refresh conversations
                  window.location.reload();
                } catch (e) {
                  console.error(e);
                  alert("Failed to delete conversation");
                }
              }
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {safeMessages.map((m: any) => {
          const outgoing = m.senderId === user?.userId;
          // determine tick state for outgoing messages (1:1)
          const otherId = conversation?.members?.find((mm: string) => mm !== user?.userId) || null;
          const isDelivered = outgoing && otherId && m.deliveredTo && m.deliveredTo.includes(otherId);
          const isRead = outgoing && otherId && m.readBy && m.readBy.includes(otherId);
          const isDeleted = !!m.deletedAt;

          // Get plaintext message (decrypted if encrypted, otherwise fallback to plaintext)
          const messageText = m.encryptedText ? decryptedTexts.get(m._id) || "🔐 Decrypting..." : m.text;

          return (
            <div key={m._id} className={`flex flex-col ${outgoing ? "items-end" : "items-start"}`}>
              {/* Reply reference */}
              {m.replyTo && (
                <div className="text-xs text-gray-500 mb-1 px-2">[Replying to message]</div>
              )}
              
                    <div className={`chat-bubble ${outgoing ? "outgoing ml-auto" : "incoming"} px-3 py-2 rounded max-w-xs group relative`}>
                {m.isPinned && <div className="text-xs text-yellow-600 font-bold">📌 Pinned</div>}
                {m.isForwarded && <div className="text-xs text-blue-600">↪️ Forwarded</div>}
                
                {isDeleted ? (
                  <div className="italic text-gray-400">[deleted]</div>
                ) : m.mediaUrl ? (
                  m.mediaType === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.mediaUrl} alt={messageText || "image"} className="max-w-full rounded" />
                  ) : m.mediaType === "video" ? (
                    <video src={m.mediaUrl} controls className="max-w-full rounded" />
                  ) : m.mediaType === "audio" && m.isVoice ? (
                    <audio src={m.mediaUrl} controls className="max-w-full" />
                  ) : (
                    <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="underline">
                      Download
                    </a>
                  )
                ) : (
                  messageText
                )}
                
                <div className="mt-1 flex items-end gap-2 justify-between">
                  <div className="flex items-center gap-1">
                    {m.editedAt && <span className="text-xs text-gray-400">(edited)</span>}
                    <div className="text-xs text-muted">{formatTimeLabel(m.createdAt)}</div>
                    {outgoing && (
                      <span className="ml-2 inline-block align-bottom">
                        {isRead ? (
                          <svg width="16" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 13L5 17L11 9" stroke="#34B7F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 13L13 17L21 9" stroke="#34B7F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : isDelivered ? (
                          <svg width="16" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 13L5 17L11 9" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 13L13 17L21 9" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                {/* Reactions display */}
                {reactionsByMessage && reactionsByMessage[m._id] && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {reactionsByMessage[m._id].map((r: any) => (
                      <button
                        key={r.emoji}
                        onClick={async () => {
                          try {
                            const userReacted = (r.userIds || []).includes(user?.userId);
                            if (userReacted) {
                              await removeReactionMut({ messageId: m._id, userId: user?.userId || "", emoji: r.emoji });
                            } else {
                              await addReactionMut({ messageId: m._id, userId: user?.userId || "", emoji: r.emoji });
                            }
                          } catch (e) {
                            console.error("Reaction toggle failed", e);
                          }
                        }}
                        className={`px-2 py-1 text-sm rounded-full border ${((r.userIds||[]).includes(user?.userId) ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200')}`}
                        type="button"
                      >
                        <span className="mr-1">{r.emoji}</span>
                        <span className="text-xs">{r.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Action buttons (Edit/Delete/Pin/Forward/Reply visible on hover) */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1 px-2 flex-wrap">
                {!isDeleted && (
                  <>
                    {outgoing && (
                      <>
                        <button
                          onClick={async () => {
                            const newText = prompt("Edit message:", messageText || "");
                            if (newText !== null && newText !== messageText) {
                              try {
                                let encryptedText: string | undefined = undefined;
                                let encryptionIv: string | undefined = undefined;
                                if (newText.trim()) {
                                  const encrypted = await encryptMsg(newText, conversationId.toString());
                                  encryptedText = encrypted.ciphertext;
                                  encryptionIv = encrypted.iv;
                                }
                                await editMessageMut({
                                  messageId: m._id,
                                  senderId: user?.userId || "",
                                  text: newText || undefined,
                                  encryptedText,
                                  encryptionIv,
                                });
                              } catch (e) {
                                console.error("Failed to edit message:", e);
                                alert("Failed to edit message");
                              }
                            }
                          }}
                          className="text-xs px-2 py-0.5 bg-blue-400 text-white rounded hover:bg-blue-500"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm("Delete this message?")) {
                              try {
                                await deleteMessageMut({ messageId: m._id, senderId: user?.userId || "" });
                              } catch (e) {
                                console.error("Failed to delete message:", e);
                                alert("Failed to delete message");
                              }
                            }
                          }}
                          className="text-xs px-2 py-0.5 bg-red-400 text-white rounded hover:bg-red-500"
                          title="Delete"
                        >
                          🗑️
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              if (m.isPinned) {
                                await unpinMessageMut({ messageId: m._id });
                              } else {
                                await pinMessageMut({ messageId: m._id, conversationId, userId: user?.userId || "" });
                              }
                            } catch (e) {
                              console.error("Failed to toggle pin:", e);
                            }
                          }}
                          className="text-xs px-2 py-0.5 bg-yellow-400 text-white rounded hover:bg-yellow-500"
                          title={m.isPinned ? "Unpin" : "Pin"}
                        >
                          {m.isPinned ? "📌" : "📍"}
                        </button>
                      </>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          // Forward to current conversation (for now)
                          const contentText = messageText || `[${m.mediaType}]`;
                          if (navigator.clipboard && contentText) {
                            await navigator.clipboard.writeText(contentText);
                            alert("Message copied to clipboard!");
                          } else {
                            alert("Message: " + contentText);
                          }
                        } catch (e) {
                          console.error("Failed to copy:", e);
                          alert("Failed to forward message");
                        }
                      }}
                      className="text-xs px-2 py-0.5 bg-green-400 text-white rounded hover:bg-green-500"
                      title="Forward (copies to clipboard)"
                    >
                      ↪️
                    </button>
                    <button
                      onClick={() => setReplyToMsg(m)}
                      className="text-xs px-2 py-0.5 bg-purple-400 text-white rounded hover:bg-purple-500"
                      title="Reply"
                    >
                      💬
                    </button>
                    <button
                      onClick={() => setShowReactionPicker(m._id)}
                      className="text-xs px-2 py-0.5 bg-pink-400 text-white rounded hover:bg-pink-500"
                      title="React"
                    >
                      😊
                    </button>
                  </>
                )}
              </div>
              
              {/* Emoji reactions picker */}
              {showReactionPicker === m._id && (
                <div className="mt-2 flex gap-1 flex-wrap px-2">
                  {["👍", "❤️", "😂", "😮", "😢", "🔥"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={async () => {
                        try {
                          await addReactionMut({ messageId: m._id, userId: user?.userId || "", emoji });
                          setShowReactionPicker(null);
                        } catch (e) {
                          console.error("Failed to react:", e);
                        }
                      }}
                      className="text-lg hover:scale-125 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t p-3 sm:p-4 flex flex-col gap-2">
        {/* Reply indicator */}
        {replyToMsg && (
          <div className="flex items-center justify-between bg-blue-50 border-l-4 border-blue-500 p-2 rounded text-sm sm:text-base">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-blue-900">Replying to:</div>
              <div className="text-sm text-blue-800 truncate">
                {replyToMsg.text || (replyToMsg.mediaType ? `[${replyToMsg.mediaType}]` : "...")}
              </div>
            </div>
            <button
              onClick={() => setReplyToMsg(null)}
              className="text-blue-500 hover:text-blue-700 font-bold ml-2 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}
        
        {filePreview && (
          <div className="mb-2">
            {fileObj?.type.startsWith("image") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={filePreview} alt="preview" className="max-w-xs rounded" />
            ) : (
              <video src={filePreview} controls className="max-w-xs rounded" />
            )}
          </div>
        )}

        <div className="flex gap-2 items-end relative flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFileObj(f);
              if (!f) {
                setFilePreview(null);
                return;
              }
              const reader = new FileReader();
              reader.onload = () => setFilePreview(String(reader.result));
              reader.readAsDataURL(f);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach photo or video"
            aria-label="Attach photo or video"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-plus">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          {/* Voice recording button */}
          <button
            type="button"
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            title={isRecording ? "Stop recording" : "Record voice message"}
            aria-label={isRecording ? "Stop recording" : "Record voice"}
            className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 ${
              isRecording ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1c-4.418 0-8 3.582-8 8v3c0 3.15-1.671 5.884-4 7.372V22h8v-2c0 .552.448 1 1 1h6c.552 0 1-.448 1-1v2h8v-2.628c-2.329-1.488-4-4.222-4-7.372v-3c0-4.418-3.582-8-8-8z" />
            </svg>
          </button>

          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((s) => !s)}
              title="Insert emoji"
              aria-label="Insert emoji"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <span className="text-lg">😊</span>
            </button>

            {showEmojiPicker && (
              <div className="absolute left-0 bottom-full mb-2 z-10 bg-white/70 backdrop-blur-sm border border-gray-200 rounded p-2 w-64 max-w-lg shadow-lg">
                {PickerComp ? (
                  // render the full picker when available
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  <PickerComp
                    onEmojiClick={(emojiData: any) => {
                      // different versions have different shapes; handle both
                      const emoji = emojiData?.emoji || emojiData?.unified || String(emojiData);
                      setText((t) => t + (emojiData?.emoji || emojiData));
                      setShowEmojiPicker(false);
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => {
                          setText((t) => t + e);
                          setShowEmojiPicker(false);
                        }}
                        className="text-2xl"
                        type="button"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {fileObj ? (
            <div className="text-xs sm:text-sm text-muted truncate max-w-xs flex-1">{fileObj.name}</div>
          ) : null}

          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              startTyping();
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message"
            className="flex-1 min-w-0 border border-gray-300 rounded px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleSend} className="bg-green-500 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base font-medium hover:bg-green-600 transition flex-shrink-0">
            Send
          </button>
        </div>
      </div>

      {/* Call panel: show when in call or when an offer/answer is generated */}
      {(inCall || localSDP) && (
        <div className="absolute bottom-24 z-20 bg-white/80 border rounded p-3 sm:w-96 w-auto inset-x-0 mx-4 sm:mx-0 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">{callType === "video" ? "Video Call" : "Voice Call"}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => { navigator.clipboard.writeText(localSDP || ""); }} className="text-sm px-2 py-1 bg-gray-100 rounded">Copy SDP</button>
              <button onClick={hangup} className="text-sm px-2 py-1 bg-red-500 text-white rounded">Hangup</button>
            </div>
          </div>

          <div className="mb-2">
            <div className="text-xs text-muted">Local SDP (share this with remote participant)</div>
            <textarea readOnly value={localSDP || ""} className="w-full h-24 mt-1 p-2 text-xs" />
          </div>

          <div>
            <div className="text-xs text-muted">Paste remote SDP here and press Apply</div>
            <textarea value={remoteSDPInput} onChange={(e) => setRemoteSDPInput(e.target.value)} className="w-full h-24 mt-1 p-2 text-xs" />
            <div className="flex gap-2 mt-2">
              <button
                onClick={async () => {
                  if (!localSDP) {
                    // caller: remoteSDPInput is the answer
                    await acceptAnswerOnCaller(remoteSDPInput);
                  } else {
                    // callee: remoteSDPInput is the offer
                    await receiveOfferAndCreateAnswer(remoteSDPInput);
                  }
                  setRemoteSDPInput("");
                }}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm"
              >
                Apply SDP
              </button>
              <button onClick={() => setRemoteSDPInput("")} className="px-3 py-1 bg-gray-100 rounded text-sm">Clear</button>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <div className="flex-1">
              <div className="text-xs text-muted">Local preview</div>
              {localStream && (
                <video className="w-full rounded" playsInline autoPlay muted ref={(el) => { if (el && localStream) el.srcObject = localStream; }} />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted">Remote preview</div>
              {remoteStream && (
                <video className="w-full rounded" playsInline autoPlay ref={(el) => { if (el && remoteStream) el.srcObject = remoteStream; }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}