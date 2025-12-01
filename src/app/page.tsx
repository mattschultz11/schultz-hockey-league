import { Button } from "@heroui/button";

export default function Home() {
  return (
    <div className="flex-col gap-6 py-24">
      <p className="text-sm tracking-[0.5em] text-slate-400 uppercase">Schultz Hockey League</p>
      <h1 className="text-4xl font-semibold text-white">Home Page</h1>
      <Button color="primary">Primary</Button>
      <Button color="secondary">Secondary</Button>
      <Button color="default">Default</Button>
      <Button color="danger">Danger</Button>
      <Button color="success">Success</Button>
      <Button color="warning">Warning</Button>
    </div>
  );
}
