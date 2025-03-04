import styles from "./styles.module.css";
function TitleBar(props: { 
    title: string ,
    
}) {
    return (
        <div className={styles.titleBar}><span>{props.title}</span></div>
    )
} 

export default TitleBar;