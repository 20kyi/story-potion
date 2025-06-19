import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import WriteDiary from './pages/WriteDiary';
import DiaryList from './pages/DiaryList';
import NovelList from './pages/NovelList';
import DiaryView from './pages/DiaryView';
import Novel from './pages/Novel';
import Navigation from './components/Navigation';
import MyPage from './pages/MyPage';
import NovelCreate from './pages/NovelCreate';
import NovelView from './pages/NovelView';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/write" element={<WriteDiary />} />
                    <Route path="/write/:date" element={<WriteDiary />} />
                    <Route path="/diaries" element={<DiaryList />} />
                    <Route path="/novels" element={<NovelList />} />
                    <Route path="/diary/date/:date" element={<DiaryView />} />
                    <Route path="/novel" element={<Novel />} />
                    <Route path="/my" element={<MyPage />} />
                    <Route path="/novel/create" element={<NovelCreate />} />
                    <Route path="/novel/view" element={<NovelView />} />
                </Routes>
                <Navigation />
            </div>
        </Router>
    );
}

export default App; 