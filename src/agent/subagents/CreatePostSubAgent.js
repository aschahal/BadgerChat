import { isLoggedIn, ofRandom } from "../Util"
import AIEmoteType from '../../components/chat/messages/AIEmoteType';

const createPostSubAgent = (end) => {

    let stage;

    let chatroom, chatrooms, title, content, confirm;

    const CS571_WITAI_ACCESS_TOKEN = "VCXCLXU4G6UUYR247L24KFXCOHG5OD3D"; // Put your CLIENT access token here.

    const handleInitialize = async (promptData) => {
        const resp = await fetch("https://cs571.org/api/s24/hw11/chatrooms", {
            headers: {
                "X-CS571-ID": CS571.getBadgerId()
            }
        });
        const data = await resp.json();
        chatrooms = data;

        if (await isLoggedIn()) {
            stage = "FOLLOWUP_CHATROOM";
            return {
                msg: ofRandom([
                "Sure, where would you like to post?",
                "Alright, where would you like to post?"
                ])
            }
        } else {
            return {
                msg: end(ofRandom([
                "You must be signed in to create a post.",
                "Please sign in before creating a post."
                ])),
                emote: AIEmoteType.ERROR
            }   
        }
    }

    const handleReceive = async (prompt) => {
        switch(stage) {
            case "FOLLOWUP_CHATROOM": return await handleFollowupChatroom(prompt);
            case "FOLLOWUP_TITLE": return await handleFollowupTitle(prompt);
            case "FOLLOWUP_CONTENT": return await handleFollowupContent(prompt);
            case "FOLLOWUP_CONFIRM": return await handleFollowupConfirm(prompt);
        }
    }

    const handleFollowupChatroom = async (prompt) => {
        chatroom = prompt;

        if (chatrooms.includes(chatroom)) {
            stage = 'FOLLOWUP_TITLE';
            return {
                msg: ofRandom([
                "Sounds good, what is the title of your post?",
                "Great, come up with a title for your post?"
                ]) 
            }
        } else {
            return {
                msg: "You must specify a chatroom to post in.",
                emote: AIEmoteType.ERROR
            }
        }
    }

    const handleFollowupTitle = async (prompt) => {
        title = prompt;

        if (!title.length > 0) {
            return {
                msg: "You must make a title for your post.",
                emote: AIEmoteType.ERROR
            }
        }

        stage = 'FOLLOWUP_CONTENT';
        return {
            msg: ofRandom([
            "Sounds good, what content will you post?",
            "Great, what content would you put in your message?"
            ])
        }
    }

    const handleFollowupContent = async (prompt) => {
        content = prompt;

        if (!content.length > 0) {
            return {
                msg: "You must put content for your post.",
                emote: AIEmoteType.ERROR
            }
        }
        
        stage = 'FOLLOWUP_CONFIRM';
        return {
            msg: ofRandom([
            `Sounds good! To confirm, you want to create a post titled '${title}' in ${chatroom}?`,
            `Great, are you ready to post this message titled '${title}' in ${chatroom}?`
            ]),
            emote: AIEmoteType.SUCCESS
        }
    }

    const handleFollowupConfirm = async (prompt) => {
        confirm = prompt;
        const resp = await fetch(`https://api.wit.ai/message?q=${encodeURIComponent(prompt)}`, {
            headers: {
                "Authorization": `Bearer ${CS571_WITAI_ACCESS_TOKEN}`
            }
        })
        const data = await resp.json();
        if (data.intents.length > 0 && data.intents[0].name === 'wit$confirmation') {
            console.log(chatroom);
            await fetch(`https://cs571.org/api/s24/hw11/messages?chatroom=${encodeURIComponent(chatroom)}`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "X-CS571-ID": CS571.getBadgerId(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title,
                    content: content
                })
            })
            return {
                msg: end(ofRandom([
                "Your message has been posted!",
                "Congrats, your message has been posted!"
                ])),
                emote: AIEmoteType.SUCCESS
            }
        } else {
            return {
                msg: end(ofRandom([
                "No worries, if you want to create a message in the future, just ask!",
                "That's alright, if you want to create a message in the future, just ask!"
                ])),
                emote: AIEmoteType.ERROR
            }
        }
    }

    return {
        handleInitialize,
        handleReceive
    }
}

export default createPostSubAgent;