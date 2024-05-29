import { isLoggedIn, ofRandom } from "../Util"
import AIEmoteType from '../../components/chat/messages/AIEmoteType';

const createRegisterSubAgent = (end) => {

    let stage;

    let username, password, repeatPassword;

    const handleInitialize = async (promptData) => {
        if (await isLoggedIn()) {
            return {
                msg: end(ofRandom([
                "You are already logged in, log out to register.",
                "You are already signed in, sign out to register new account."
                ])),
                emote: AIEmoteType.ERROR
            }
        } else {
            stage = "FOLLOWUP_USERNAME";
            return {
                msg: ofRandom([
                "Sure, what username would you like to use?",
                "Alright, what is your new username?"
                ])
            }
        }
    }

    const handleReceive = async (prompt) => {
        switch(stage) {
            case "FOLLOWUP_USERNAME": return await handleFollowupUsername(prompt);
            case "FOLLOWUP_PASSWORD": return await handleFollowupPassword(prompt);
            case "FOLLOWUP_REPEAT_PASSWORD": return await handleFollowupRepeatPassword(prompt);
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
        password = prompt;
        stage = "FOLLOWUP_REPEAT_PASSWORD";
        return {
            msg: ofRandom([
            "Great, confirm your password.",
            "Thanks, please confirm your passowrd."
            ]),
            nextIsSensitive: true
        }
    }

    const handleFollowupRepeatPassword = async (prompt) => {
        repeatPassword = prompt;

        if (repeatPassword !== password) {
            return {
                msg: "Passwords do not match!",
                emote: AIEmoteType.ERROR
            }
        }

        const resp = await fetch("https://cs571.org/api/s24/hw11/register", {
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
                `Successfully registered account! Welcome ${username}.`,
                `Success! You have register a new account. Welcome ${username}.`
                ])),
                emote: AIEmoteType.SUCCESS
            }
        } else if (resp.status === 409) {
            return "Sorry, this user already exists!";
        } else {
            return {
                msg: end(ofRandom([
                "Sorry, registration wasn't successful.",
                "Sorry, couldn't register account.",
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

export default createRegisterSubAgent;