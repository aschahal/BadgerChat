import { isLoggedIn, ofRandom } from "../Util"
import AIEmoteType from '../../components/chat/messages/AIEmoteType';

const createLoginSubAgent = (end) => {

    let stage;

    let username, password;

    const handleInitialize = async (promptData) => {
        if (await isLoggedIn()) {
            return {
                msg: end(ofRandom([
                "You are already logged in, try logging out first.",
                "You are already signed in, try signing out first."
                ])),
                emote: AIEmoteType.ERROR
            }
        } else {
            stage = "FOLLOWUP_USERNAME";
            return {
                msg: ofRandom([
                "Sure, what is your username?",
                "Alright, what is your username?"
                ])
            }
        }
    }

    const handleReceive = async (prompt) => {
        switch(stage) {
            case "FOLLOWUP_USERNAME": return await handleFollowupUsername(prompt);
            case "FOLLOWUP_PASSWORD": return await handleFollowupPassword(prompt);
        }
    }

    const handleFollowupUsername = async (prompt) => {
        username = prompt;
        stage = "FOLLOWUP_PASSWORD";
        return {
            msg: ofRandom([
            "Great, and what is your password?",
            "Thanks, and what is your password?"
            ]),
            nextIsSensitive: true
        }
    }

    const handleFollowupPassword = async (prompt) => {
        password = "Sensitive information redacted!";
        const resp = await fetch("https://cs571.org/api/s24/hw11/login", {
            method: "POST",
            credentials: "include",
            headers: {
                "X-CS571-ID": CS571.getBadgerId(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: prompt
            })
        })
        
        if (resp.status === 200) {
            return {
                msg: end(ofRandom([
                "Successfully logged in!",
                "Success! You have been logged in."
                ])),
                emote: AIEmoteType.SUCCESS,
            }
        } else {
            return {
                msg: end(ofRandom([
                "Sorry, that username and password is incorrect.",
                "Sorry, your username or password is incorrect.",
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

export default createLoginSubAgent;