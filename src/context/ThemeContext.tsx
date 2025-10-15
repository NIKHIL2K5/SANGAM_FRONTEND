import React,{createContext,useState,useEffect, Children, type ReactNode} from "react";

interface ThemeContextType{
    theme:string
    toggleTheme:()=>void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider : React.FC<{children:ReactNode}>=({children})=>{
    const [theme,setTheme]=useState("light")

    useEffect(()=>{
        const savedTheme=localStorage.getItem("theme")
        if (savedTheme) setTheme(savedTheme)
    },[])

    const toggleTheme=()=>{
        const newTheme = theme==="light"?"dark":"light"
        setTheme(newTheme)
        localStorage.setItem("theme",newTheme)
        document.documentElement.classList.toggle("dark",newTheme==="dark")
    }
    return(
        <ThemeContext.Provider value={{theme,toggleTheme}}>
        {children}
        </ThemeContext.Provider>
    )
}
