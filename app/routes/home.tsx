import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import { resumes } from "../../constants";
import Resumecard from "~/components/Resumecard";
import { useEffect } from "react";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  const {auth}=usePuterStore()
      
      const navigate=useNavigate()
      useEffect(() => {
        if(!auth.isAuthenticated) navigate('/auth?next=/');
      }, [auth.isAuthenticated])
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart Feedback For Your DREAM JOB!" },
  ];
}

export default function Home() {
  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar/>
    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track your Applications and Resume Ratings</h1>
        <h2>Review your submissions and check AI-powered feedback.</h2>
      </div>
    
    {resumes.length>0 &&(
      <div className="resumes-section">
    {resumes.map((resume)=>(
      <Resumecard key={resume.id} resume={resume}/>
     
    ))}
     </div>
  )}
  </section>
  </main>
}
