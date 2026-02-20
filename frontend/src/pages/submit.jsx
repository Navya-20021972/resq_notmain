import axios from 'axios';
import { useState } from 'react';

export default function Submit() {
  const [form, setForm] = useState({});
  const [ref, setRef] = useState(null);

  const submit = async () => {
    const fd = new FormData();
    Object.keys(form).forEach(k => fd.append(k, form[k]));
    const res = await axios.post(
      'http://localhost:8000/api/missing/',
      fd
    );
    setRef(res.data.reference_id);
  };

  return (
    <>
      <input placeholder="Name" onChange={e => setForm({...form,name:e.target.value})}/>
      <input type="file" onChange={e => setForm({...form,photo:e.target.files[0]})}/>
      <button onClick={submit}>Submit</button>
      {ref && <p>Reference ID: {ref}</p>}
    </>
  );
}
