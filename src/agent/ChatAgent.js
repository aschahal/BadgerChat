import createChatDelegator from "./ChatDelegator";
import { ofRandom, isLoggedIn, getLoggedInUsername, logout } from "./Util";
import AIEmoteType from '../components/chat/messages/AIEmoteType';

const createChatAgent = () => {
    const CS571_WITAI_ACCESS_TOKEN = "VCXCLXU4G6UUYR247L24KFXCOHG5OD3D"; // Put your CLIENT access token here.

    const delegator = createChatDelegator();

    let chatrooms = [];

    const handleInitialize = async () => {
        const resp = await fetch("https://cs571.org/api/s24/hw11/chatrooms", {
            headers: {
                "X-CS571-ID": CS571.getBadgerId()
            }
        });
        const data = await resp.json();
        chatrooms = data;

        return "Welcome to BadgerChat! My name is Bucki, how can I help you?";
    }

    const handleReceive = async (prompt) => {
        if (delegator.hasDelegate()) { return delegator.handleDelegation(prompt); }
        const resp = await fetch(`https://api.wit.ai/message?q=${encodeURIComponent(prompt)}`, {
            headers: {
                "Authorization": `Bearer ${CS571_WITAI_ACCESS_TOKEN}`
            }
        })
        const data = await resp.json();
        if (data.intents.length > 0) {
            switch (data.intents[0].name) {
                case "get_help": return handleGetHelp();
                case "get_chatrooms": return handleGetChatrooms();
                case "get_messages": return handleGetMessages(data);
                case "login": return handleLogin();
                case "register": return handleRegister();
                case "create_message": return handleCreateMessage(data);
                case "logout": return handleLogout();
                case "whoami": return handleWhoAmI();
            }
        }
        return "Sorry, I didn't get that. Type 'help' to see what you can do!";
    }

    const handleTranscription = async (rawSound, contentType) => {
        const resp = await fetch(`https://api.wit.ai/dictation`, {
            method: "POST",
            headers: {
                "Content-Type": contentType,
                "Authorization": `Bearer ${CS571_WITAI_ACCESS_TOKEN}`
            },
            body: rawSound
        })
        const data = await resp.text();
        const transcription = data
            .split(/\r?\n{/g)
            .map((t, i) => i === 0 ? t : `{${t}`)  // Turn the response text into nice JS objects
            .map(s => JSON.parse(s))
            .filter(chunk => chunk.is_final)       // Only keep the final transcriptions
            .map(chunk => chunk.text)
            .join(" ");                            // And conjoin them!
        return transcription;
    }

    const handleSynthesis = async (txt) => {
        if (txt.length > 280) {
            return undefined;
        } else {
            const resp = await fetch(`https://api.wit.ai/synthesize`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "audio/wav",
                    "Authorization": `Bearer ${CS571_WITAI_ACCESS_TOKEN}`
                },
                body: JSON.stringify({
                    q: txt,
                    voice: "Rebecca",
                    style: "soft"
                })
            })
            const audioBlob = await resp.blob()
            return URL.createObjectURL(audioBlob);
        }
    }

    const handleGetHelp = async () => {
        const helpResp = [
            "Try asking 'register for an account', or ask for more help!",
            "Try asking 'tell me the latest 3 messages', or ask for more help!",
            "Try asking 'login', or ask for more help!"
        ];
        
        return {
            msg: ofRandom(helpResp),
            emote: AIEmoteType.NORMAL
        }
    }

    const handleGetChatrooms = async () => {
        return {
            msg: `Of course, there are 8 chatrooms: ${chatrooms}`
        }
    }

    const handleGetMessages = async (data) => {
        const hasChatroom = data.entities["chatrooms:chatrooms"] ? true : false;
        const chatroomName = hasChatroom ? data.entities["chatrooms:chatrooms"][0].value : ''; // issue here
        const hasNumber = data.entities["wit$number:number"] ? true : false;
        const numMessage = hasNumber ? data.entities["wit$number:number"][0].value : 1;

        const resp = await fetch(`https://cs571.org/api/s24/hw11/messages?chatroom=${encodeURIComponent(chatroomName)}&num=${numMessage}`, {
            headers: {
                "X-CS571-ID": CS571.getBadgerId()
            }
        });

        const messages = await resp.json();
        
        const message = messages.messages;

        return message.map(m => `In ${m.chatroom}, ${m.poster} created a post titled '${m.title}' saying '${m.content}'`);
    }

    const handleLogin = async () => {
        return await delegator.beginDelegation("LOGIN");
    }

    const handleRegister = async () => {
        return await delegator.beginDelegation("REGISTER");
    }

    const handleCreateMessage = async (data) => {
        return await delegator.beginDelegation("CREATE");
    }

    const handleLogout = async () => {
        if (await isLoggedIn()) {
            await logout();
            return {
                msg: ofRandom([
                "You have been signed out, goodbye!",
                "You have been logged out."
                ]),
                emote: AIEmoteType.SUCCESS
            }
        } else {
            return {
               msg:  ofRandom([
                "You are not currently logged in!",
                "You aren't logged in."
                ]),
               emote: AIEmoteType.ERROR
            }
        }
    }

    const handleWhoAmI = async () => {
        let usersname;

        if (await isLoggedIn()) {
            return `You are currently logged in as ${await getLoggedInUsername(usersname)}.`;
        } else {
            return "You are currently not logged in.";
        }
    }

    return {
        handleInitialize,
        handleReceive,
        handleTranscription,
        handleSynthesis
    }
}

export default createChatAgent;