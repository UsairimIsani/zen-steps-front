import { useEffect, useState } from "react";
import { AgentCircle } from "./AgentCircle"
import { ChatMessage } from "./ChatMessage";
import { Message } from "../types/Message";
import { Username } from "./Username";



export const Agent = () => {
    
    const [loadingResponse, setLoadingResponse] = useState<boolean>(false);
    const [sendPressed, setSendPressed] = useState<boolean>(false);
    const [systemContent, setSystemContent] = useState<string>('');
    const [username, setUsername] = useState<string>()
    const TEXT_GENERATION_URL = process.env.REACT_APP_TEXT_API_URL || '';
    const SPEECH_GENERATION_URL = process.env.REACT_APP_SPEECH_API_URL || '';
    const systemPrompt: Message = {

        role: "system",
        content: systemContent
    }
    const [conversation, setConversation] = useState<Message[]>([systemPrompt]);

    const handleUsername = (username: string) => {
        setUsername(username);
    }

    useEffect(() => {
        const systemPromptString = `You are a therapist giving a therapy session to ${username}. Give me a 130-word inspirational meditation session about overcoming chronic pain or other issues. Only output the actual session without ambiance instructions, quotation marks or 'Certainly, here's a 130-word inspirational meditation session on overcoming chronic pain:'. End the session by asking the patient if they would like to continue with another session. NEVER answer  'As an AI language model' or anything similar to that. Just help the user with their meditation`
        setSystemContent(systemPromptString);
    },[username])

    useEffect(() => {
        const handleSend = async () => {
            console.log("API CALL")
            setLoadingResponse(true);
            console.log(conversation)
            try {
                const response = await fetch(TEXT_GENERATION_URL, {
                    method: 'POST',
                    //mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ messages: conversation }),
                });
    
                if (!response.ok) {
                    setLoadingResponse(false);
                    setSendPressed(false);
                    throw new Error(`HTTP error! Status: ${response.status}`);
                    
                }
    
                const data = await response.json();
                console.log('API response:', data);
                setConversation((prevMessages) => [...prevMessages, { role: 'assistant', content: data.content}]);
                //setLoadingResponse(false);
                makeSpeech(data.content)
            } catch (error: any) {
                setSendPressed(false);
                setLoadingResponse(false);
                console.error('Error sending API request:', error.message);
            }
        };

        
    
        if (sendPressed) {
            handleSend();
        }
    }, [sendPressed]);

    const makeSpeech = async (content: string) => {
        const audio = new Audio();
        try {
            const response = await fetch(SPEECH_GENERATION_URL, {
                method: 'POST',
                //mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                setLoadingResponse(false);
                setSendPressed(false);
                throw new Error(`HTTP error! Status: ${response.status}`);
                
            }
            
            const data = await response.blob();
            const url = window.URL.createObjectURL(data)
            audio.src = url
            audio.play();
            setLoadingResponse(false);
            setSendPressed(false);
            
        } catch (error: any) {
            setSendPressed(false);
            setLoadingResponse(false);
            console.error('Error sending API request:', error.message);
        }

    }
    
    const handleMessage = (message: Message) => {
        
      setConversation((prevMessages) => [...prevMessages, message]);
      setSendPressed(true);
    };
    
    return(
        <div className="flex flex-col w-screen bg-slate-900 pt-4 h-full items-center justify-evenly relative ">
            <div className="flex">
                <h1 className=" text-slate-500 text-4xl">Zen Steps</h1>
            </div>
            <div className="flex relative">
                <AgentCircle/>   
            </div>
            {loadingResponse && 
            <div className="flex relative">
                <div className="loader">
                    <div className="cell d-0"></div>
                    <div className="cell d-1"></div>
                    <div className="cell d-2"></div>
                    <div className="cell d-1"></div>
                    <div className="cell d-2"></div>
                    <div className="cell d-2"></div>
                    <div className="cell d-3"></div>
                    <div className="cell d-3"></div>
                    <div className="cell d-4"></div>
                </div>
            </div>
            }
            
            <div className="flex flex-col w-full items-center gap-2 overflow-x-auto scroll-auto h-1/4">
            {conversation &&
                conversation.map((message, index) =>
                  message.role === 'user' && (
                    <div key={index} className="rounded grid grid-cols-1 bg-slate-800 sm:max-w-[41.666667%] max-w-[80%] min-h-[25%] max-h-[200%] text-left pl-3 pr-3 text-slate-400 content-center">
                        <div className="flex flex-row gap-2">
                            <span className=" font-bold">User:</span>
                            <span>{message.content}</span>
                        </div>
                    </div>
                  ) 
        
                )
                }
            </div>
            {!username ? 
                <div className="flex w-6/12">
                <Username username={handleUsername}/> </div> :
                <div className="flex w-6/12">
                    <ChatMessage message={handleMessage} username={username}/>
                </div>
            }
        </div>
    )
}