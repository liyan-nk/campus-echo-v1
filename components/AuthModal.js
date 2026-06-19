// components/AuthModal.js
import { AuthService }       from "../services/authService.js";
import { AVAILABLE_CLASSES } from "../data/demoData.js";
import { DEMO_MODE }         from "../config/firebase.js";

const { useState } = React;
const e = React.createElement;

const DEMO_ACCOUNTS = [
  { label:"Admin",         email:"admin@campus.edu",    note:"full access + identity view" },
  { label:"Faculty",       email:"s.chen@campus.edu",   note:"badge on posts"              },
  { label:"Mod S2 CSE",    email:"r.nair@campus.edu",   note:"approves S2 CSE"             },
  { label:"Mod S4 CSE",    email:"a.menon@campus.edu",  note:"approves S4 CSE"             },
  { label:"Mod S6 ECE",    email:"m.pillai@campus.edu", note:"approves S6 ECE"             },
  { label:"Student ✅",    email:"j.lee@campus.edu",    note:"approved"                    },
  { label:"Student ⏳",    email:"r.das@campus.edu",    note:"pending approval"            },
];

export function AuthModal({ onClose, onSuccess }) {
  const [mode,      setMode]      = useState("login");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [name,      setName]      = useState("");
  const [className, setClassName] = useState(AVAILABLE_CLASSES[0]);
  const [err,       setErr]       = useState("");
  const [loading,   setLoading]   = useState(false);

  const switchMode = m => { setMode(m); setErr(""); };

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      const user = mode==="login"
        ? await AuthService.login(email, password)
        : await AuthService.signup(email, password, name.trim(), className);
      onSuccess(user);
    } catch(ex) { setErr(ex.message); }
    finally { setLoading(false); }
  };

  const handleKey   = ev => { if(ev.key==="Enter") submit(); };
  const handleOverlay = ev => { if(ev.target===ev.currentTarget) onClose(); };

  return e("div",{className:"modal-overlay", onClick:handleOverlay},
    e("div",{className:"modal"},
      e("h2",{style:{marginBottom:20,fontFamily:"var(--fh)",fontSize:24}},
        mode==="login"?"Sign In":"Create Account"),

      // Demo quick-login
      DEMO_MODE && e("div",{style:{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:14,marginBottom:18}},
        e("p",{style:{fontSize:11,color:"var(--warn)",fontFamily:"var(--fm)",marginBottom:10}},
          "⚡ DEMO — click any role (any password works)"),
        e("div",{style:{display:"flex",flexWrap:"wrap",gap:6}},
          DEMO_ACCOUNTS.map(a=>
            e("button",{key:a.email, className:"btn-ghost btn-sm", title:a.note,
              onClick:()=>{ setEmail(a.email); setPassword("demo1234"); setMode("login"); }},
              a.label)
          )
        )
      ),

      err && e("div",{className:"alert alert-error"}, err),

      mode==="signup" && e("div",{className:"form-group"},
        e("label",{className:"form-label"},"Full Name"),
        e("input",{value:name, onChange:ev=>setName(ev.target.value),
          placeholder:"Your full name", onKeyDown:handleKey})),

      e("div",{className:"form-group"},
        e("label",{className:"form-label"},"Email"),
        e("input",{type:"email", value:email, onChange:ev=>setEmail(ev.target.value),
          placeholder:"you@campus.edu", onKeyDown:handleKey})),

      e("div",{className:"form-group"},
        e("label",{className:"form-label"},"Password"),
        e("input",{type:"password", value:password, onChange:ev=>setPassword(ev.target.value),
          placeholder:mode==="signup"?"Min. 6 characters":"Password", onKeyDown:handleKey})),

      mode==="signup" && e("div",{className:"form-group"},
        e("label",{className:"form-label"},"Class / Batch"),
        e("select",{value:className, onChange:ev=>setClassName(ev.target.value)},
          AVAILABLE_CLASSES.map(c=>e("option",{key:c,value:c},c))),
        e("p",{className:"form-hint"},
          "Your account will be reviewed by your class moderator before you can post.")),

      e("button",{className:"btn-primary",
        style:{width:"100%",padding:13,fontSize:15,marginBottom:14},
        onClick:submit, disabled:loading},
        loading?"…":(mode==="login"?"Sign In":"Create Account")),

      e("p",{style:{textAlign:"center",fontSize:13,color:"var(--muted)"}},
        mode==="login"?"No account? ":"Already have an account? ",
        e("span",{className:"link", onClick:()=>switchMode(mode==="login"?"signup":"login")},
          mode==="login"?"Sign up":"Log in")),
    )
  );
}
