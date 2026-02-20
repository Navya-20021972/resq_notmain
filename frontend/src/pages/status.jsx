import axios from 'axios';
import { useState } from 'react';

export default function Status() {
  const [ref, setRef] = useState('');
  const [data, setData] = useState(null);

  const check = async () => {
    const res = await axios.get(
      `http://localhost:8000/api/status/${ref}/`
    );
    setData(res.data);
  };

  return (
    <>
      <input onChange={e => setRef(e.target.value)} />
      <button onClick={check}>Check Status</button>
      {data && <pre>{JSON.stringify(data,null,2)}</pre>}
    </>
  );
}
