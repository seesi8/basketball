import Image from 'next/image';
import styles from '../styles/header.module.css';

export default function Header() {
return (
    <div className={styles.header}>
        <a className={styles.home} href="/">Dynasty-Basketball.com</a>
    </div>
);
}