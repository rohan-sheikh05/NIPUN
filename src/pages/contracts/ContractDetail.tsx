import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getContract, listContractFiles, updateEscrowStatus } from '../../lib/api';
import { Card, TitleBlockMeta } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FileUpload } from '../../components/files/FileUpload';
import { FileList } from '../../components/files/FileList';
import { MessageThread } from '../../components/messages/MessageThread';

export function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    if (!id) return;
    const f = await listContractFiles(id);
    setFiles(f);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getContract(id), listContractFiles(id)]).then(([c, f]) => {
      setContract(c);
      setFiles(f);
      setLoading(false);
    });
  }, [id]);

  async function handleEscrowAction(next: 'funded' | 'released') {
    if (!id) return;
    await updateEscrowStatus(id, next);
    setContract((prev: any) => (prev ? { ...prev, escrow_status: next } : prev));
  }

  if (loading) return <p className="text-line-500 font-mono text-sm">Loading…</p>;
  if (!contract) return <p className="text-line-500 font-mono text-sm">Contract not found.</p>;

  const isClient = session?.user.id === contract.client_id;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <p className="label-tag">Contract</p>
            <StatusBadge status={contract.escrow_status} />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-4">{contract.jobs?.title}</h1>

          <Card>
            <TitleBlockMeta
              fields={[
                { label: 'Client', value: contract.client?.full_name ?? '—' },
                { label: 'Student', value: contract.student?.full_name ?? '—' },
                { label: 'Amount', value: `৳${contract.agreed_amount}` },
                { label: 'Since', value: new Date(contract.created_at).toLocaleDateString() },
              ]}
            />
          </Card>

          {isClient && (
            <div className="mt-4 flex gap-3">
              {contract.escrow_status === 'pending' && (
                <Button size="sm" onClick={() => handleEscrowAction('funded')}>
                  Fund escrow (demo)
                </Button>
              )}
              {contract.escrow_status === 'funded' && (
                <Button size="sm" onClick={() => handleEscrowAction('released')}>
                  Release payment (demo)
                </Button>
              )}
            </div>
          )}
          {!isClient && contract.escrow_status !== 'released' && (
            <p className="label-tag mt-4">
              Escrow is {contract.escrow_status === 'pending' ? 'not yet funded' : 'funded and held'} by the client.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="label-tag">Deliverables</p>
            {session && <FileUpload contractId={id!} uploaderId={session.user.id} onUploaded={loadFiles} />}
          </div>
          <FileList files={files} />
        </div>
      </div>

      <div>
        <p className="label-tag mb-4">Messages</p>
        {session && <MessageThread contractId={id!} currentUserId={session.user.id} />}
      </div>
    </div>
  );
}
