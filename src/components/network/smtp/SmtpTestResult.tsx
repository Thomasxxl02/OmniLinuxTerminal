import { StatusBox, Status } from '../StatusBox';

// ===========================================================================
// Résultat des tests SMTP (présentation) : boîtes de statut du test de
// connexion et de l'envoi. Les états viennent du backend Rust.
// ===========================================================================

interface SmtpTestResultProps {
  testStatus: Status;
  sendStatus: Status;
}

export function SmtpTestResult({ testStatus, sendStatus }: SmtpTestResultProps) {
  return (
    <>
      <StatusBox st={testStatus} />
      <StatusBox st={sendStatus} />
    </>
  );
}
